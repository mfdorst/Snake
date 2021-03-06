import { Snake } from './snake.js'
import { spawnFood } from './food.js'
import { drawUnit, boardSize } from './draw.js'
import { aStar } from './a-star.js'
import { TryNotToDieStrategy } from './try-not-to-die.js'

const foodColor = '#a44'

export class Game {
  /**
   *
   * @param {*} ctx
   */
  constructor(ctx) {
    this.snake = new Snake()
    this.food = spawnFood(this.snake)
    this.paused = true
    this.ctx = ctx
    this.ai = true
    this.showPathfinding = false
    this.tryNotToDieStrategy = null

    try {
      const bestHeading = aStar(
        this.snake.body[this.snake.body.length - 1],
        this.food,
        makeGrid(this.snake),
        this.ctx,
        this.showPathfinding
      )
      if (this.ai) {
        this.snake.queueTurn(bestHeading)
      }
    } catch (ignore) {}
    drawUnit(ctx, this.food, foodColor)
    this.snake.draw(ctx)
  }

  update(override) {
    if (this.paused && !override) return

    // Check if there will be a wall collision
    const nextHead = this.snake.nextHead()
    if (nextHead.x >= boardSize || nextHead.x < 0 || nextHead.y >= boardSize || nextHead.y < 0) {
      this.gameOver()
      return
    }

    // Check if there will be a snake collision
    if (this.snake.body.slice(1).some(unit => nextHead.x === unit.x && nextHead.y === unit.y)) {
      console.log(this.snake.body)
      console.log(this.snake.body.slice(1))
      console.log(nextHead)
      this.gameOver()
      return
    }

    const eating = this.snake.willEat(this.food)
    if (eating) {
      this.food = spawnFood(this.snake)
      drawUnit(this.ctx, this.food, foodColor)
    }
    this.snake.move(eating)

    this.ctx.clearRect(0, 0, 600, 600)
    try {
      const bestHeading = aStar(
        this.snake.body[this.snake.body.length - 1],
        this.food,
        makeGrid(this.snake),
        this.ctx,
        this.showPathfinding
      )
      if (this.ai) {
        this.snake.queueTurn(bestHeading)
        this.tryNotToDieStrategy = null
      }
    } catch (e) {
      drawUnit(this.ctx, this.food, foodColor)
      this.snake.draw(this.ctx)
      if (this.ai) {
        if (!this.tryNotToDieStrategy) {
          this.tryNotToDieStrategy = new TryNotToDieStrategy()
        }
        this.tryNotToDieStrategy.nextDirection(this.snake, makeGrid(this.snake))
      }
    }

    drawUnit(this.ctx, this.food, foodColor)
    this.snake.draw(this.ctx)
    this.updateScore(this.snake.body.length - 4)
  }

  gameOver() {
    const message = document.getElementById('message')
    message.textContent = 'Game Over'
    this.paused = true
  }

  updateScore(score) {
    const scoreView = document.getElementById('score')
    scoreView.textContent = `Score: ${score}`
  }
}

/**
 * @param {Snake} snake
 */
function makeGrid(snake) {
  const grid = new Array(boardSize)
    .fill(null)
    .map(() => new Array(boardSize).fill(null).map(() => ({ traversable: true })))

  for (const { x, y } of snake.body) {
    grid[x][y].traversable = false
  }
  // Tail will move next frame, so make it traversable
  const { x, y } = snake.body[0]
  grid[x][y].traversable = true
  return grid
}
