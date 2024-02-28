import { PointerEvent, useCallback, useEffect, useState } from 'react';
import {
	useBroadcastEvent,
	useEventListener,
	useMyPresence,
	useOthers,
} from '@/liveblocks.config';
import LiveCursors from './cursor/liveCursors';
import CursorChat from './cursor/cursorChat';
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import ReactionSelector from './reaction/reactionButton';
import FlyingReaction from './reaction/flyingReaction';
import useInterval from '@/hooks/useInterval';

const Live = () => {
	const others = useOthers();
	const broadcast = useBroadcastEvent();
	const [{ cursor }, updateMyPresence] = useMyPresence() as any;

	const [cursorState, setCursorState] = useState<CursorState>({
		mode: CursorMode.Hidden,
	});
	const [reactions, setReactions] = useState<Reaction[]>([]);

	// Remove reactions that are not visible anymore (every 1 sec)
	useInterval(() => {
		setReactions((reactions) =>
			reactions.filter(
				(reaction) => reaction.timestamp > Date.now() - 4000
			)
		);
	}, 1000);

	useInterval(() => {
		if (
			cursorState.mode === CursorMode.Reaction &&
			cursorState.isPressed &&
			cursor
		) {
			// concat all the reactions created on mouse click
			setReactions((reactions) =>
				reactions.concat([
					{
						point: { x: cursor.x, y: cursor.y },
						value: cursorState.reaction,
						timestamp: Date.now(),
					},
				])
			);

			// Broadcast the reaction to other users
			broadcast({
				x: cursor.x,
				y: cursor.y,
				value: cursorState.reaction,
			});
		}
	}, 100);

	useEventListener((eventData) => {
		const event = eventData.event as ReactionEvent;
		setReactions((reactions) =>
			reactions.concat([
				{
					point: { x: event.x, y: event.y },
					value: event.value,
					timestamp: Date.now(),
				},
			])
		);
	});

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

			{reactions.map((item) => (
				<FlyingReaction
					key={item.timestamp.toString()}
					value={item.value}
					x={item.point.x}
					y={item.point.y}
					timestamp={item.timestamp}
				/>
			))}

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
