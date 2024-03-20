enum TaskStatus {
  IDLE,
  PENDING,
  FAILED
}

type TaskOp = () => Promise<unknown>
type QueueCallback = (task: Task, error?: Error) => void

interface Task {
  op: TaskOp
  timestamp: number
  reversion: number
  status: TaskStatus
}

interface QueueOptions {
  concurrency: number
  scheduleInterval: number
  taskIntervalTime: number
}

export class Queue {
  private tasks: Task[] = []

  private timer: any = null

  private readonly concurrency: number

  private readonly scheduleInterval: number

  private readonly taskIntervalTime: number

  private reversion: number

  private lastlySyncAt: number

  private lastlyReversion: number

  private startQueueCallback?: QueueCallback | null

  private successQueueCallback?: QueueCallback | null

  private failQueueCallback?: QueueCallback | null

  constructor(options: QueueOptions) {
    this.concurrency = options.concurrency
    this.scheduleInterval = options.scheduleInterval
    this.taskIntervalTime = options.taskIntervalTime
    this.reversion = 0
    this.lastlyReversion = 0
    this.lastlySyncAt = 0
    this.timer = setInterval(this.schedule.bind(this), this.scheduleInterval)
  }

  public add(op: TaskOp) {
    this.reversion += 1

    const task = {
      op,
      timestamp: Date.now(),
      reversion: this.reversion,
      status: TaskStatus.IDLE
    }

    if (this.tasks[0]?.status === TaskStatus.IDLE) {
      this.tasks[0] = task
    } else {
      this.tasks.unshift(task)
    }

    if (Date.now() - this.lastlySyncAt > this.taskIntervalTime) {
      this.consume(task)
    }
  }

  public onStart(startQueueCallback: QueueCallback) {
    this.startQueueCallback = startQueueCallback
  }

  public onSuccess(successQueueCallback: QueueCallback) {
    this.successQueueCallback = successQueueCallback
  }

  public onFail(failQueueCallback: QueueCallback) {
    this.failQueueCallback = failQueueCallback
  }

  public hasTask() {
    return this.tasks.length > 0
  }

  public clear() {
    this.tasks = []
    this.startQueueCallback = null
    this.successQueueCallback = null
    this.failQueueCallback = null

    if (!this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private schedule() {
    const tasks = this.tasks

    if (tasks.length < 1) {
      return
    }

    const pending = tasks.filter(task => task.status === TaskStatus.PENDING)
    if (pending.length >= this.concurrency) {
      return
    }

    let task = tasks.find(task => task.status === TaskStatus.IDLE)

    // Try to reconsume failed tasks
    if (!task) {
      task = tasks[0]
    }

    this.consume(task)
  }

  private async consume(task: Task) {
    if (task.reversion < this.lastlyReversion) {
      return
    }

    const index = this.tasks.findIndex(row => row.reversion === task.reversion)

    if (index < 0) {
      return
    }

    this.tasks[index].status = TaskStatus.PENDING
    this.lastlySyncAt = Date.now()
    this.startQueueCallback && this.startQueueCallback(task)

    try {
      await task.op()

      if (task.reversion >= this.lastlyReversion) {
        this.lastlyReversion = task.reversion
      }

      this.remove(task.reversion)
      this.successQueueCallback && this.successQueueCallback(task)
    } catch (err: any) {
      this.update(task.reversion, {
        status: TaskStatus.FAILED
      })
      this.failQueueCallback && this.failQueueCallback(task, err)
    }
  }

  private remove(reversion: number) {
    const index = this.tasks.findIndex(row => row.reversion === reversion)

    if (index > -1) {
      this.tasks.splice(index, 1)
    }
  }

  private update(reversion: number, updates: Record<string, any>) {
    const index = this.tasks.findIndex(row => row.reversion === reversion)

    if (index > -1) {
      this.tasks[index] = {
        ...this.tasks[index],
        ...updates
      }
    }
  }
}
