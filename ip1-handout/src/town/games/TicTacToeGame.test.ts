import { createPlayerForTesting } from '../../TestUtils';
import Player from '../../lib/Player';
import { TicTacToeMove } from '../../types/CoveyTownSocket';
import TicTacToeGame from './TicTacToeGame';

describe('TicTacToeGame', () => {
  let game: TicTacToeGame;

  beforeEach(() => {
    game = new TicTacToeGame();
  });

  describe('[T1.1] _join', () => {
    describe('When the player can be added', () => {
      it('makes the first player X and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();
        game.join(player);
        expect(game.state.x).toEqual(player.id);
        expect(game.state.o).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });

      it('makes the second player O and changes status to IN_PROGRESS', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);
        expect(game.state.status).toEqual('IN_PROGRESS');
      });

      it('throws an error if a player is already in the game', () => {
        const player1 = createPlayerForTesting();
        game.join(player1);
        expect(() => game.join(player1)).toThrowError();
      });

      it('throws an error if more than two players try to join', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const player3 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        expect(() => game.join(player3)).toThrowError();
      });
    });
  });

  describe('[T1.2] _leave', () => {
    describe('when the player is in the game', () => {
      it('when x leaves, it sets the game status to OVER and declares o the winner', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);

        game.leave(player1);

        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player2.id);
        expect(game.state.moves).toHaveLength(0);
      });

      it('when o leaves, it sets the game status to OVER and declares x the winner', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);

        game.leave(player2);

        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player1.id);
        expect(game.state.moves).toHaveLength(0);
      });

      it('when x leaves and only one player is left, it sets the game status to OVER and declares the remaining player the winner', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);

        game.leave(player1);

        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player2.id);
        expect(game.state.moves).toHaveLength(0);
      });

      it('when o leaves and only one player is left, it sets the game status to OVER and declares the remaining player the winner', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        expect(game.state.x).toEqual(player1.id);
        expect(game.state.o).toEqual(player2.id);

        game.leave(player2);

        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player1.id);
        expect(game.state.moves).toHaveLength(0);
      });

      it('when x leaves and no player is left, it sets the game status to WAITING_TO_START', () => {
        const player1 = createPlayerForTesting();
        game.join(player1);

        game.leave(player1);

        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
      });
    });

    it('throws an error if the player is not in the game', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);

      expect(() => game.leave(player2)).toThrowError();
    });
  });

  describe('applyMove', () => {
    describe('when given a valid move', () => {
      let player1: Player;
      let player2: Player;
      beforeEach(() => {
        player1 = createPlayerForTesting();
        player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
      });

      it('should add the move to the game state and check for win condition', () => {
        const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
        const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };
        const move3: TicTacToeMove = { row: 1, col: 0, gamePiece: 'X' };
        const move4: TicTacToeMove = { row: 1, col: 1, gamePiece: 'O' };
        const move5: TicTacToeMove = { row: 2, col: 0, gamePiece: 'X' };

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          }),
        ).not.toThrowError();

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: move2,
          }),
        ).not.toThrowError();

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move3,
          }),
        ).not.toThrowError();

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: move4,
          }),
        ).not.toThrowError();

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move5,
          }),
        ).not.toThrowError();

        expect(game.state.moves).toHaveLength(5);
        expect(game.state.status).toEqual('OVER');
        expect(game.state.winner).toEqual(player1.id);
      });

      it('should throw an error if the move is out of turn', () => {
        const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
        const move2: TicTacToeMove = { row: 0, col: 1, gamePiece: 'O' };

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player2.id, // This is the player that should not be making a move
            move: move2,
          }),
        ).toThrowError(); // This expects the error to be thrown
        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          }),
        ).not.toThrowError();
      });

      it('should throw an error if the move is invalid', () => {
        const move1: TicTacToeMove = { row: 0, col: 0, gamePiece: 'X' };
        const invalidMove: TicTacToeMove = { row: 0, col: 0, gamePiece: 'O' };

        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: move1,
          }),
        ).not.toThrowError();
        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: invalidMove,
          }),
        ).toThrowError();
      });
    });
  });
});
