import { useEffect, useRef, useState } from "react";
import "./AboutCardStack.css";

function AboutCardStack({ cards }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const startX = useRef(0);
  const moved = useRef(false);

  /*
   * Show the drag hint only once per browser session.
   */
  useEffect(() => {
    const hintShown = sessionStorage.getItem(
      "about_card_stack_hint"
    );

    if (!hintShown) {
      setShowHint(true);
    }
  }, []);

  const markInteracted = () => {
    sessionStorage.setItem(
      "about_card_stack_hint",
      "true"
    );

    setShowHint(false);
  };

  /*
   * Move the current card to the back.
   */
  const nextCard = () => {
    markInteracted();

    setActiveIndex(
      (current) => (current + 1) % cards.length
    );

    setDragX(0);
  };

  /*
   * Start dragging.
   */
  const handlePointerDown = (event) => {
    startX.current = event.clientX;
    moved.current = false;

    setIsDragging(true);

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  /*
   * Follow the pointer while dragging.
   */
  const handlePointerMove = (event) => {
    if (!isDragging) return;

    const distance =
      event.clientX - startX.current;

    if (Math.abs(distance) > 5) {
      moved.current = true;
    }

    setDragX(distance);
  };

  /*
   * Finish dragging.
   */
  const handlePointerUp = (event) => {
    if (!isDragging) return;

    const distance =
      event.clientX - startX.current;

    setIsDragging(false);

    if (Math.abs(distance) > 80) {
      nextCard();
    } else {
      setDragX(0);
    }

    event.currentTarget.releasePointerCapture(
      event.pointerId
    );
  };

  /*
   * Cancel an interrupted drag.
   */
  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragX(0);
  };

  /*
   * Clicking the active card advances it.
   *
   * A drag should NOT also trigger a click.
   */
  const handleClick = () => {
    if (moved.current) return;

    nextCard();
  };

  return (
    <div className="about-card-stack">
      {cards.map((card, index) => {
        /*
         * Calculate where this card currently sits
         * in the visible stack.
         *
         * 0 = front
         * 1 = behind front
         * 2 = third card
         */
        const position =
          (index - activeIndex + cards.length) %
          cards.length;

        /*
         * Only keep the front three cards rendered.
         */
        if (position > 1) return null;

        const isActive = position === 0;

        return (
          <article
            key={card.id ?? card.title}
            className={`
              about-card
              about-card-position-${position}
              ${isActive ? "about-card-active" : ""}
              ${isDragging && isActive ? "is-dragging" : ""}
            `}
            style={
              isActive
                ? {
                    transform: `
                      translateX(${dragX}px)
                      rotate(${dragX * 0.02}deg)
                    `,
                    opacity: Math.max(
                      0,
                      1 - Math.abs(dragX) / 700
                    ),
                  }
                : undefined
            }
            onPointerDown={
              isActive
                ? handlePointerDown
                : undefined
            }
            onPointerMove={
              isActive
                ? handlePointerMove
                : undefined
            }
            onPointerUp={
              isActive
                ? handlePointerUp
                : undefined
            }
            onPointerCancel={
              isActive
                ? handlePointerCancel
                : undefined
            }
            onClick={
              isActive
                ? handleClick
                : undefined
            }
          >
            <img
              className="about-card-image"
              src={card.image}
              alt={card.title}
              draggable="false"
            />

            <div className="about-card-overlay" />

            {isActive && (
              <>

                <div className="about-card-content">
                  <h3>{card.title}</h3>
                </div>

                {showHint && (
                  <div className="about-card-hint">
                    ← Drag to explore →
                  </div>
                )}
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default AboutCardStack;
