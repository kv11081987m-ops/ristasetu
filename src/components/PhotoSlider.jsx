import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { cloudinaryThumb } from '../utils/cloudinaryUrl';

/**
 * Reusable photo slider.
 * props:
 *   photos        – string[]  (URL array; falls back to single-photo if length===1)
 *   isFirstVisible – bool     (false → first photo also locked, e.g. showPhotoToAll===false)
 *   canViewAll    – bool      (true for owner / admin / matched user)
 *   imgClassName  – string    (CSS class applied to the <img>)
 *   currentIndex  – number    (controlled; optional)
 *   onIndexChange – fn(i)     (called when index changes; optional)
 *   thumbWidth    – number    (Cloudinary delivery width; smaller for grid cards)
 */
const PhotoSlider = ({
  photos,
  isFirstVisible = true,
  canViewAll = false,
  imgClassName = 'w-full h-64 object-cover',
  currentIndex: controlledIndex,
  onIndexChange,
  thumbWidth = 600,
}) => {
  const [internalIdx, setInternalIdx] = useState(0);
  const touchStartX = useRef(null);

  const list = photos?.length > 0 ? photos : [];
  if (list.length === 0) return null;

  const idx = controlledIndex !== undefined ? controlledIndex : internalIdx;

  const goTo = (i) => {
    const next = (i + list.length) % list.length;
    setInternalIdx(next);
    onIndexChange?.(next);
  };

  const canView = (i) => (i === 0 ? isFirstVisible : canViewAll);
  const isLocked = !canView(idx);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) goTo(idx + (delta > 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <div
      className="relative overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo */}
      <img
        src={cloudinaryThumb(isLocked ? (list[0] || '') : list[idx], thumbWidth)}
        alt={`Photo ${idx + 1}`}
        className={`${imgClassName} transition-all duration-300 ${isLocked ? 'blur-xl scale-110 brightness-50' : ''}`}
        loading="lazy"
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x400/png?text=No+Photo'; }}
      />

      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-full mb-2">
            <Lock size={18} className="text-white" />
          </div>
          <p className="text-white text-xs font-bold leading-snug">
            Interest accept hone ke<br />baad dikhegi
          </p>
        </div>
      )}

      {/* Arrows — only when multiple photos */}
      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(idx - 1); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/65 text-white rounded-full flex items-center justify-center border-none cursor-pointer backdrop-blur-sm transition-colors"
          >
            <ChevronLeft size={15} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(idx + 1); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/65 text-white rounded-full flex items-center justify-center border-none cursor-pointer backdrop-blur-sm transition-colors"
          >
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dots */}
      {list.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {list.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all duration-200 ${
                i === idx ? 'w-3.5 h-1.5 bg-white' : `w-1.5 h-1.5 ${canView(i) ? 'bg-white/70' : 'bg-white/30'}`
              }`}
            />
          ))}
        </div>
      )}

      {/* Locked-count badge (top-left) when user can't see all */}
      {list.length > 1 && !canViewAll && idx === 0 && isFirstVisible && (
        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Lock size={8} />
          {list.length - 1}
        </div>
      )}
    </div>
  );
};

export default PhotoSlider;
