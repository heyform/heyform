enum Status {
  IDLE,
  PENDING,
  FAILED
}

type Event = 'start' | 'complete' | 'failed'
type Callback = (event: Event, task: Task, error?: Error) => void

interface Task {
  timestamp: number
  version: number
  status: Status
}

interface Options {
  concurrency?: number
  scheduleInterval?: number
  taskTimeout?: number
}

export class Queue {
  public lastSyncedAt: number
  private tasks: Task[] = []
  private timer: unknown = null
  private readonly concurrency: number
  private readonly scheduleInterval: number
  private readonly taskTimeout: number
  private version: number
  private lastSyncedVersion: number
  private callback?: Callback
  private syncFunction?: () => Promise<void>

  constructor(options?: Options) {
    this.concurrency = options?.concurrency || 1
    this.scheduleInterval = options?.scheduleInterval || 2_000
    this.taskTimeout = options?.taskTimeout || 10_000
    this.version = 0
    this.lastSyncedVersion = 0
    this.lastSyncedAt = 0
    this.timer = setInterval(this.schedule.bind(this), this.scheduleInterval)
  }

  public add() {
    this.version += 1

    const task = {
      timestamp: Date.now(),
      version: this.version,
      status: Status.IDLE
    }

    if (this.tasks[0]?.status === Status.IDLE) {
      this.tasks[0] = task
    } else {
      this.tasks.unshift(task)
    }

    if (Date.now() - this.lastSyncedAt > this.taskTimeout) {
      this.consume(task)
    }
  }

  public on(callback: Callback) {
    this.callback = callback
  }

  public sync(syncFunction: () => Promise<void>) {
    this.syncFunction = syncFunction
  }

  public hasTask() {
    return this.tasks.length > 0
  }

  public clear() {
    this.tasks = []
    this.callback = null as unknown as Callback

    if (!this.timer) {
      clearInterval(this.timer as number)
      this.timer = null
    }
  }

  private schedule() {
    const tasks = this.tasks

    if (tasks.length < 1) {
      return
    }

    const pending = tasks.filter(task => task.status === Status.PENDING)
    if (pending.length >= this.concurrency) {
      return
    }

    let task = tasks.find(task => task.status === Status.IDLE)

    // Try to reconsume failed tasks
    if (!task) {
      task = tasks[0]
    }

    this.consume(task)
  }

  private async consume(task: Task) {
    if (task.version < this.lastSyncedVersion) {
      return
    }

    const index = this.tasks.findIndex(row => row.version === task.version)

    if (index < 0) {
      return
    }

    this.tasks[index].status = Status.PENDING
    this.lastSyncedAt = Date.now()

    // Start callback
    this.callback?.('start', task)

    try {
      await this.syncFunction?.()

      if (task.version >= this.lastSyncedVersion) {
        this.lastSyncedVersion = task.version
      }

      this.remove(task.version)

      // Complete callback
      this.callback?.('complete', task)
    } catch (err: unknown) {
      this.update(task.version, {
        status: Status.FAILED
      })

      // Failed callback
      this.callback?.('failed', task, err as Error)
    }
  }

  private remove(version: number) {
    const index = this.tasks.findIndex(row => row.version === version)

    if (index > -1) {
      this.tasks.splice(index, 1)
    }
  }

  private update(version: number, updates: Partial<Task>) {
    const index = this.tasks.findIndex(row => row.version === version)

    if (index > -1) {
      this.tasks[index] = {
        ...this.tasks[index],
        ...updates
      }
    }
  }
}
