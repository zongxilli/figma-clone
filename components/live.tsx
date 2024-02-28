import { PointerEvent, useCallback, useEffect, useState } from 'react';
import { useMyPresence, useOthers } from '@/liveblocks.config';
import LiveCursors from './cursor/liveCursors';
import CursorChat from './cursor/cursorChat';
import { CursorMode, CursorState, Reaction } from '@/types/type';
import ReactionSelector from './reaction/reactionButton';

const Live = () => {
	const others = useOthers();
	const [{ cursor }, updateMyPresence] = useMyPresence() as any;

	const [cursorState, setCursorState] = useState<CursorState>({
		mode: CursorMode.Hidden,
	});
	const [reactions, setReactions] = useState<Reaction[]>([]);

	const handlePointerMove = useCallback(
		(event: PointerEvent) => {
			event.preventDefault();

			if (
				cursor === null ||
				cursorState.mode !== CursorMode.ReactionSelector
			) {
				const x =
					event.clientX -
					event.currentTarget.getBoundingClientRect().x;
				const y =
					event.clientY -
					event.currentTarget.getBoundingClientRect().y;

				updateMyPresence({ cursor: { x, y } });
			}
		},
		[cursor, cursorState.mode, updateMyPresence]
	);

	const handlePointerLeave = useCallback(
		(event: PointerEvent) => {
			setCursorState({ mode: CursorMode.Hidden });
			updateMyPresence({ cursor: null, message: null });
		},
		[updateMyPresence]
	);

	const handlePointerDown = useCallback(
		(event: PointerEvent) => {
			const x =
				event.clientX - event.currentTarget.getBoundingClientRect().x;
			const y =
				event.clientY - event.currentTarget.getBoundingClientRect().y;

			updateMyPresence({ cursor: { x, y } });

			setCursorState((state) =>
				cursorState.mode === CursorMode.Reaction
					? { ...state, isPressed: true }
					: state
			);
		},
		[cursorState.mode, updateMyPresence]
	);

	const handlePointerUp = useCallback(() => {
		setCursorState((state) =>
			cursorState.mode === CursorMode.Reaction
				? { ...state, isPressed: false }
				: state
		);
	}, [cursorState.mode, setCursorState]);

	useEffect(() => {
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === '/') {
				setCursorState({
					mode: CursorMode.Chat,
					previousMessage: null,
					message: '',
				});
			} else if (e.key === 'Escape') {
				updateMyPresence({ message: '' });
				setCursorState({ mode: CursorMode.Hidden });
			} else if (e.key === 'e') {
				setCursorState({ mode: CursorMode.ReactionSelector });
			}
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === '/') {
				e.preventDefault();
			}
		};

		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [updateMyPresence]);

	const setReaction = useCallback((reaction: string) => {
		setCursorState({
			mode: CursorMode.Reaction,
			reaction,
			isPressed: false,
		});
	}, []);

	return (
		<div
			onPointerMove={handlePointerMove}
			onPointerLeave={handlePointerLeave}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			className='h-[100vh] w-full flex justify-center items-center text-center'
		>
			<h1 className='text-2xl text-white'>Liveblocks Figma Clone</h1>

			{cursor && (
				<CursorChat
					cursor={cursor}
					cursorState={cursorState}
					setCursorState={setCursorState}
					updateMyPresence={updateMyPresence}
				/>
			)}

			{cursorState.mode === CursorMode.ReactionSelector && (
				<ReactionSelector setReaction={setReaction} />
			)}

			<LiveCursors others={others} />
		</div>
	);
};

export default Live;
