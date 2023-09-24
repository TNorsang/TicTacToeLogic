import InvalidParametersError, {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameMove,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
  TicTacToeMove,
} from '../../types/CoveyTownSocket';
import GameArea from './GameArea';
import TicTacToeGame from './TicTacToeGame';

/**
 * A TicTacToeGameArea is a GameArea that hosts a TicTacToeGame.
 * @see TicTacToeGame
 * @see GameArea
 */
export default class TicTacToeGameArea extends GameArea<TicTacToeGame> {
  protected getType(): InteractableType {
    return 'TicTacToeArea';
  }

  /**
   * Handle a command from a player in this game area.
   * Supported commands:
   * - JoinGame (joins the game `this._game`, or creates a new one if none is in progress)
   * - GameMove (applies a move to the game)
   * - LeaveGame (leaves the game)
   *
   * If the command ended the game, records the outcome in this._history
   * If the command is successful (does not throw an error), calls this._emitAreaChanged (necessary
   *  to notify any listeners of a state update, including any change to history)
   * If the command is unsuccessful (throws an error), the error is propagated to the caller
   *
   * @see InteractableCommand
   *
   * @param command command to handle
   * @param player player making the request
   * @returns response to the command, @see InteractableCommandResponse
   * @throws InvalidParametersError if the command is not supported or is invalid. Invalid commands:
   *  - LeaveGame and GameMove: No game in progress (GAME_NOT_IN_PROGRESS_MESSAGE),
   *        or gameID does not match the game in progress (GAME_ID_MISSMATCH_MESSAGE)
   *  - Any command besides LeaveGame, GameMove and JoinGame: INVALID_COMMAND_MESSAGE
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'JoinGame') {
      try {
        // Create a new game if one doesn't exist
        if (!this._game || this._game.state.status === 'OVER') {
          this._game = new TicTacToeGame();
        }

        this._game.join(player);

        if (this._game.state.status === 'IN_PROGRESS') {
          this._emitAreaChanged();
        }

        return { gameID: this._game.id } as InteractableCommandReturnType<CommandType>;
      } catch (error) {
        if (error instanceof Error) {
          throw new InvalidParametersError(error.message);
        } else {
          throw error;
        }
      }
    } else if (command.type === 'GameMove') {
      if (!this._game || this._game.state.status !== 'IN_PROGRESS') {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }

      const gameMove: GameMove<TicTacToeMove> = {
        playerID: player.id,
        gameID: this._game.id,
        move: command.move,
      };

      try {
        // Apply the move to the game
        this._game.applyMove(gameMove);

        // Check if the game is over and if so, record the outcome
        if (this._game.state.status === 'OVER') {
          this._history.push({
            gameID: this._game.id,
            scores: {
              [player.userName]: 0, // Update the score as needed
            },
          });
          // Clear the game instance since it's over
          this._game = undefined;
        }

        // Notify that the game state has changed
        this._emitAreaChanged();

        // Return an appropriate value, e.g., an empty object
        return {} as InteractableCommandReturnType<CommandType>;
      } catch (error) {
        if (error instanceof Error) {
          throw new InvalidParametersError(error.message);
        } else {
          throw error;
        }
      }
    } else if (command.type === 'LeaveGame') {
      if (!this._game || this._game.state.status !== 'IN_PROGRESS') {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }

      try {
        // Try to leave the game
        this._game.leave(player);

        // Check if the game is over and if so, record the outcome
        if (this._game.state.status === 'OVER') {
          this._history.push({
            gameID: this._game.id,
            scores: {
              [player.userName]: 0, // Update the score as needed
            },
          });
          // Clear the game instance since it's over
          this._game = undefined;
        }

        // Notify that the player has left the game
        this._emitAreaChanged();

        // Return an appropriate value, e.g., an empty object
        return {} as InteractableCommandReturnType<CommandType>;
      } catch (error) {
        if (error instanceof Error) {
          throw new InvalidParametersError(error.message);
        } else {
          throw error;
        }
      }
    } else {
      throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
    }
  }
}
