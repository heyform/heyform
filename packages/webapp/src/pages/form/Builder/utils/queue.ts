type Event = 'start' | 'complete' | 'failed'

// Coalesce edits, serialize saves, and finish pending work when the builder unmounts.
export class Queue {
  private revision = 0
  private savedRevision = 0
  private saving = false
  private disposed = false
  private lastStartedAt = 0
  private callback?: (event: Event) => void
  private syncFunction?: () => Promise<void>
  private timer = setInterval(() => void this.flush(), 2_000)

  public sync(syncFunction: () => Promise<void>) {
    this.syncFunction = syncFunction
  }

  public on(callback: (event: Event) => void) {
    this.callback = callback
  }

  public add() {
    this.revision += 1
    this.callback?.('start')
    if (Date.now() - this.lastStartedAt > 10_000) {
      void this.flush()
    }
  }

  public dispose() {
    this.disposed = true
    clearInterval(this.timer)
    this.callback = undefined
    void this.flush()
  }

  private async flush() {
    if (this.saving || this.savedRevision === this.revision || !this.syncFunction) return

    const revision = this.revision
    this.saving = true
    this.lastStartedAt = Date.now()
    this.callback?.('start')
    let succeeded = false

    try {
      await this.syncFunction()
      this.savedRevision = revision
      succeeded = true
      if (this.savedRevision === this.revision) this.callback?.('complete')
    } catch {
      // The sync callback reports the error. Retry on the next tick while mounted.
      this.callback?.('failed')
    } finally {
      this.saving = false
      if (this.disposed && succeeded) void this.flush()
    }
  }
}
