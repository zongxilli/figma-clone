import { PointerEvent, useCallback, useEffect, useState } from 'react';
import { useMyPresence, useOthers } from '@/liveblocks.config';
import LiveCursors from './cursor/liveCursors';
import CursorChat from './cursor/cursorChat';
import { CursorMode } from '@/types/type';

const Live = () => {
	const others = useOthers();
	const [{ cursor }, updateMyPresence] = useMyPresence() as any;

	const [cursorState, setCursorState] = useState({ mode: CursorMode.Hidden });

	const handlePointerMove = useCallback(
		(event: PointerEvent) => {
			event.preventDefault();

			const x =
				event.clientX - event.currentTarget.getBoundingClientRect().x;
			const y =
				event.clientY - event.currentTarget.getBoundingClientRect().y;

			updateMyPresence({ cursor: { x, y } });
		},
		[updateMyPresence]
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
		},
		[updateMyPresence]
	);

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

	return (
		<div
			onPointerMove={handlePointerMove}
			onPointerLeave={handlePointerLeave}
			onPointerDown={handlePointerDown}
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

			<LiveCursors others={others} />
		</div>
	);
};

export default Live;
