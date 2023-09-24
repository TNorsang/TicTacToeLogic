import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, TicTacToeGameState, TicTacToeMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A TicTacToeGame is a Game that implements the rules of Tic Tac Toe.
 * @see https://en.wikipedia.org/wiki/Tic-tac-toe
 */
export default class TicTacToeGame extends Game<TicTacToeGameState, TicTacToeMove> {
  public constructor() {
    super({
      moves: [],
      status: 'WAITING_TO_START',
    });
  }

  /*
   * Applies a player's move to the game.
   * Uses the player's ID to determine which game piece they are using (ignores move.gamePiece)
   * Validates the move before applying it. If the move is invalid, throws an InvalidParametersError with
   * the error message specified below.
   * A move is invalid if:
   *    - The move is on a space that is already occupied (use BOARD_POSITION_NOT_EMPTY_MESSAGE)
   *    - The move is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   *    - The game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   *
   * If the move is valid, applies the move to the game and updates the game state.
   *
   * If the move ends the game, updates the game's state.
   * If the move results in a tie, updates the game's state to set the status to OVER and sets winner to undefined.
   * If the move results in a win, updates the game's state to set the status to OVER and sets the winner to the player who made the move.
   * A player wins if they have 3 in a row (horizontally, vertically, or diagonally).
   *
   * @param move The move to apply to the game
   * @throws InvalidParametersError if the move is invalid (with specific message noted above)
   */
  public applyMove(move: GameMove<TicTacToeMove>): void {
    const { moves, status, x } = this.state;
    const currentPlayerID = move.playerID;
    const currentPlayerPiece = currentPlayerID === x ? 'X' : 'O';

    // Check if the game is in progress
    if (status !== 'IN_PROGRESS') {
      throw new InvalidParametersError('GAME_NOT_IN_PROGRESS_MESSAGE');
    }

    // Check if it's the player's turn
    if (
      (currentPlayerPiece === 'X' && moves.length % 2 !== 0) ||
      (currentPlayerPiece === 'O' && moves.length % 2 === 0)
    ) {
      throw new InvalidParametersError('MOVE_NOT_YOUR_TURN_MESSAGE');
    }

    const { row, col } = move.move;

    // Check if the selected position is already occupied
    if (this._isPositionOccupied(row, col)) {
      throw new InvalidParametersError('BOARD_POSITION_NOT_EMPTY_MESSAGE');
    }

    // Apply the move by adding it to the list of moves
    const newMovesArray = [...moves];
    newMovesArray.push(move.move);

    // Check if the move resulted in a win
    if (this._checkForWin(row, col, currentPlayerPiece)) {
      this.state.status = 'OVER';
      this.state.winner = currentPlayerID;
    } else if (moves.length === 9) {
      // If all positions are filled, it's a tie
      this.state.status = 'OVER';
      this.state.winner = undefined; // Set the winner to undefined for a tie
    }
  }

  /**
   * Helper function to check if a position on the board is already occupied.
   *
   * @param row The row index of the position
   * @param col The column index of the position
   * @returns True if the position is occupied, false otherwise
   */
  private _isPositionOccupied(row: number, col: number): boolean {
    const { moves } = this.state;
    return moves.some(move => move.row === row && move.col === col);
  }

  /**
   * Helper function to check if the current move results in a win.
   * Checks for three in a row horizontally, vertically, or diagonally.
   *
   * @param row The row index of the last move
   * @param col The column index of the last move
   * @param currentPlayerPiece The game piece of the current player
   * @returns True if the current move results in a win, false otherwise
   */
  private _checkForWin(row: number, col: number, currentPlayerPiece: 'X' | 'O'): boolean {
    const { moves } = this.state;

    // Check for three in a row horizontally
    let rowCount = 0;
    for (let i = 0; i < 3; i++) {
      if (
        moves.some(
          move => move.row === row && move.col === i && move.gamePiece === currentPlayerPiece,
        )
      ) {
        rowCount++;
      }
    }
    if (rowCount === 3) {
      return true;
    }

    // Check for three in a row vertically
    let colCount = 0;
    for (let i = 0; i < 3; i++) {
      if (
        moves.some(
          move => move.row === i && move.col === col && move.gamePiece === currentPlayerPiece,
        )
      ) {
        colCount++;
      }
    }
    if (colCount === 3) {
      return true;
    }

    // Check for three in a row diagonally (top-left to bottom-right)
    if (row === col) {
      let diagCount = 0;
      for (let i = 0; i < 3; i++) {
        if (
          moves.some(
            move => move.row === i && move.col === i && move.gamePiece === currentPlayerPiece,
          )
        ) {
          diagCount++;
        }
      }
      if (diagCount === 3) {
        return true;
      }
    }

    // Check for three in a row diagonally (top-right to bottom-left)
    if (row + col === 2) {
      let reverseDiagCount = 0;
      for (let i = 0; i < 3; i++) {
        if (
          moves.some(
            move => move.row === i && move.col === 2 - i && move.gamePiece === currentPlayerPiece,
          )
        ) {
          reverseDiagCount++;
        }
      }
      if (reverseDiagCount === 3) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds a player to the game.
   * Updates the game's state to reflect the new player.
   * If the game is now full (has two players), updates the game's state to set the status to IN_PROGRESS.
   *
   * @param player The player to join the game
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   *  or the game is full (GAME_FULL_MESSAGE)
   */
  public _join(player: Player): void {
    // See if the player is already in the game
    if (this._players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }

    // Check if the game is already full (has 2 players)
    if (this._players.length >= 2) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    // Add the player to the game if it's not full
    if (this._players.length === 0) {
      // Set the first player (X)
      this.state.x = player.id;
    } else if (this._players.length === 1) {
      // Set the second player (O)
      this.state.o = player.id;
      // Update the game status to indicate that it's now in progress
      this.state.status = 'IN_PROGRESS';
    }

    // Now, the player is successfully added to the game
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   * If the game has two players in it at the time of call to this method,
   *   updates the game's status to OVER and sets the winner to the other player.
   * If the game does not yet have two players in it at the time of call to this method,
   *   updates the game's status to WAITING_TO_START.
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    // if player is not in the game
    if (!this._players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    // removing player
    this._players = this._players.filter(p => p.id !== player.id);

    // When a player count is 1, change status to OVER and make the other player the winner
    if (this._players.length === 1) {
      this.state.status = 'OVER';
      this.state.winner = this._players[0].id;
    } else if (this._players.length === 0) {
      this.state.status = 'WAITING_TO_START';
    }
  }
}
