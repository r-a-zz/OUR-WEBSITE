import { useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';

export function useSpringFade(visible = true, config = { tension: 170, friction: 26 }) {
  const mounted = useRef(false);
  const styles = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(6px)',
    config,
  });

  useEffect(() => {
    if (!mounted.current) mounted.current = true;
  }, []);

  return { styles, animated };
}
