'use client';

import * as React from 'react';
import { StarIcon } from 'lucide-react';

import {
  ScrollingNumber as ScrollingNumberPrimitive,
  ScrollingNumberContainer as ScrollingNumberContainerPrimitive,
  ScrollingNumberItems as ScrollingNumberItemsPrimitive,
  ScrollingNumberHighlight as ScrollingNumberHighlightPrimitive,
  type ScrollingNumberContainerProps as ScrollingNumberContainerPrimitiveProps,
} from '@/components/animate-ui/primitives/texts/scrolling-number';
import { cn } from '@/lib/utils';
import {
  Particles,
  ParticlesEffect,
} from '@/components/animate-ui/primitives/effects/particles';

function percentageBetween(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

type GitHubStarsWheelProps = {
  username?: string;
  repo?: string;
  direction?: 'btt' | 'ttb';
  delay?: number;
  value?: number;
  step?: number;
} & Omit<
  ScrollingNumberContainerPrimitiveProps,
  'direction' | 'number' | 'step'
>;

function GitHubStarsWheel({
  username,
  repo,
  direction = 'btt',
  itemsSize = 35,
  sideItemsCount = 2,
  delay = 0,
  step = 100,
  value,
  className,
  ...props
}: GitHubStarsWheelProps) {
  const [stars, setStars] = React.useState<number | null>(value ?? null);
  const [currentStars, setCurrentStars] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);
  const roundedStars = React.useMemo(
    () => (stars === null ? null : Math.round(stars / step) * step),
    [stars, step],
  );
  const isCompleted = React.useMemo(
    () => roundedStars !== null && currentStars === roundedStars,
    [currentStars, roundedStars],
  );
  const fillPercentage = React.useMemo(
    () =>
      roundedStars === null
        ? 0
        : percentageBetween(currentStars, 0, roundedStars),
    [currentStars, roundedStars],
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setStars(value);
      setIsLoading(false);
      return;
    }

    if (!username || !repo) {
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(`https://api.github.com/repos/${username}/${repo}`)
        .then((response) => response.json())
        .then((data) => {
          if (data && typeof data.stargazers_count === 'number') {
            setStars(data.stargazers_count);
          }
        })
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
    }, delay);

    return () => clearTimeout(timeout);
  }, [username, repo, value, delay]);

  React.useEffect(() => {
    if (isLoading || stars === null) return;
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isLoading, stars]);

  return (
    !isLoading && stars !== null && roundedStars !== null && (
      <ScrollingNumberContainerPrimitive
        key={direction}
        className={cn(
          'w-28 opacity-0 transition-opacity duration-300',
          isVisible && 'opacity-100',
          className,
        )}
        direction={direction}
        number={roundedStars}
        step={step}
        itemsSize={itemsSize}
        onNumberChange={setCurrentStars}
        {...props}
        style={{ transitionDelay: `${delay}ms`, ...props.style }}
      >
        <div
          className="absolute top-0 left-0 z-10 w-full bg-gradient-to-t from-transparent to-background"
          style={{
            height: `${itemsSize * sideItemsCount}px`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 z-10 w-full bg-gradient-to-b from-transparent to-background"
          style={{
            height: `${itemsSize * sideItemsCount}px`,
          }}
        />
        <ScrollingNumberPrimitive delay={delay}>
          <ScrollingNumberItemsPrimitive className="flex items-center justify-start pl-8" />
        </ScrollingNumberPrimitive>
        <ScrollingNumberHighlightPrimitive className="flex size-full items-center border-0 bg-transparent pl-2">
          <Particles animate={isCompleted}>
            <StarIcon
              aria-hidden="true"
              className="fill-neutral-300 stroke-neutral-300 dark:fill-neutral-700 dark:stroke-neutral-700 size-4"
            />
            <StarIcon
              aria-hidden="true"
              className="absolute top-0 left-0 size-4 fill-yellow-500 stroke-yellow-500"
              style={{
                clipPath: `inset(${100 - (isCompleted ? fillPercentage : fillPercentage - 10)}% 0 0 0)`,
              }}
            />
            <ParticlesEffect
              delay={0.5}
              className="size-1 rounded-full bg-yellow-500"
            />
          </Particles>
          {isCompleted && (
            <span className="relative z-10 ml-2 tabular-nums" aria-hidden="true">
              {stars.toLocaleString()}
            </span>
          )}
        </ScrollingNumberHighlightPrimitive>
      </ScrollingNumberContainerPrimitive>
    )
  );
}

export { GitHubStarsWheel, type GitHubStarsWheelProps };
