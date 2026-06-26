import { motion, useMotionValue, useTransform } from 'motion/react';
import { useState, useEffect, type ReactNode } from 'react';

interface CardRotateProps {
    children: ReactNode;
    onSendToBack: () => void;
    sensitivity: number;
    disableDrag?: boolean;
}

function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }: CardRotateProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [60, -60]);
    const rotateY = useTransform(x, [-100, 100], [-60, 60]);

    function handleDragEnd(_: unknown, info: { offset: { x: number; y: number } }) {
        if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
            onSendToBack();
        } else {
            x.set(0);
            y.set(0);
        }
    }

    if (disableDrag) {
        return (
            <motion.div className="absolute w-full h-full cursor-pointer" style={{ x: 0, y: 0 }}>
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            className="absolute w-full h-full cursor-grab"
            style={{ x, y, rotateX, rotateY }}
            drag
            dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
            dragElastic={0.6}
            whileTap={{ cursor: 'grabbing' }}
            onDragEnd={handleDragEnd}
        >
            {children}
        </motion.div>
    );
}

interface AnimationConfig {
    stiffness: number;
    damping: number;
}

interface ImageStackProps {
    images: string[];
    randomRotation?: boolean;
    sensitivity?: number;
    animationConfig?: AnimationConfig;
    sendToBackOnClick?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    pauseOnHover?: boolean;
    mobileClickOnly?: boolean;
    mobileBreakpoint?: number;
}

interface CardItem {
    id: number;
    src: string;
}

export default function ImageStack({
    images,
    randomRotation = true,
    sensitivity = 200,
    animationConfig = { stiffness: 150, damping: 20 },
    sendToBackOnClick = true,
    autoplay = false,
    autoplayDelay = 2000,
    pauseOnHover = false,
    mobileClickOnly = false,
    mobileBreakpoint = 768,
}: ImageStackProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [stack, setStack] = useState<CardItem[]>(() =>
        images.map((src, i) => ({ id: i, src }))
    );

    useEffect(() => {
        setStack(images.map((src, i) => ({ id: i, src })));
    }, [images]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < mobileBreakpoint);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [mobileBreakpoint]);

    const shouldDisableDrag = mobileClickOnly && isMobile;
    const shouldEnableClick = sendToBackOnClick || shouldDisableDrag;

    const sendToBack = (id: number) => {
        setStack(prev => {
            const next = [...prev];
            const idx = next.findIndex(c => c.id === id);
            const [card] = next.splice(idx, 1);
            next.unshift(card);
            return next;
        });
    };

    useEffect(() => {
        if (!autoplay || stack.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            sendToBack(stack[stack.length - 1].id);
        }, autoplayDelay);
        return () => clearInterval(interval);
    }, [autoplay, autoplayDelay, stack, isPaused]);

    return (
        <div
            className="relative w-full h-full"
            style={{ perspective: '600px' }}
            onMouseEnter={() => pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        >
            {stack.map((card, index) => {
                const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
                return (
                    <CardRotate
                        key={card.id}
                        onSendToBack={() => sendToBack(card.id)}
                        sensitivity={sensitivity}
                        disableDrag={shouldDisableDrag}
                    >
                        <motion.div
                            className="rounded-2xl overflow-hidden w-full h-full flex items-center justify-center"
                            onClick={() => shouldEnableClick && sendToBack(card.id)}
                            animate={{
                                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                                scale: 1 + index * 0.06 - stack.length * 0.06,
                                transformOrigin: '90% 90%',
                            }}
                            initial={false}
                            transition={{
                                type: 'spring',
                                stiffness: animationConfig.stiffness,
                                damping: animationConfig.damping,
                            }}
                        >
                            <img
                                src={card.src}
                                alt={`card-${index + 1}`}
                                draggable={false}
                                className="w-full h-full object-cover pointer-events-none select-none"
                            />
                        </motion.div>
                    </CardRotate>
                );
            })}
        </div>
    );
}
