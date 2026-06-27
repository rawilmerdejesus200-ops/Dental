import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==========================================
// IMAGE URLS (Strictly using requested URLs)
// ==========================================
const HERO_IMAGE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_113640_ccf3cf97-d447-425b-a134-d7b09fc743fc.png&w=1280&q=85';

const SECTION2_IMAGE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114219_414dfe80-f15c-4e25-bf52-b13721f4bd88.png&w=1280&q=85';

const SECTION3_IMG1 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115253_c19ab167-8dd5-48b4-967d-b9f0d9d6e8fb.png&w=1280&q=85';

const SECTION3_IMG2 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115237_fc519057-6e87-4abf-999a-9610b8b085b4.png&w=1280&q=85';

const SECTION3_BG = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114355_752ba9e6-0942-4abb-9047-5d9bb16632e9.png&w=1280&q=85';

// ==========================================
// DATA CONSTANTS (Strictly using requested data)
// ==========================================
const featureBars = ['Advanced Dentistry', 'High Quality Equipment', 'Friendly Staff'];

const initialServices = [
  { name: 'Dental\nVeneers', num: '01', active: true },
  { name: 'Dental\nCrowns', num: '02', active: false },
  { name: 'Teeth\nWhitening', num: '03', active: false },
  { name: 'Dental\nImplants', num: null, active: false },
];

const navLinks = ['Home', 'Services', 'About', 'Gallery', 'Contact'];

// ==========================================
// CUSTOM HOOKS
// ==========================================

interface MaskPosition {
  x: number;
  y: number;
  sw: number;
  sh: number;
}

/**
 * Hook: useMaskPositions
 * Computes mask layout parameters of card elements relative to section.
 */
const useMaskPositions = (
  sectionRef: React.RefObject<HTMLElement | null>,
  cardRefs: React.MutableRefObject<(HTMLElement | null)[]>
) => {
  const [positions, setPositions] = useState<MaskPosition[]>([]);

  const updatePositions = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const sectionRect = section.getBoundingClientRect();
    if (sectionRect.width === 0 || sectionRect.height === 0) return;

    const newPositions = cardRefs.current.map((card) => {
      if (!card) {
        return { x: 0, y: 0, sw: sectionRect.width, sh: sectionRect.height };
      }
      const cardRect = card.getBoundingClientRect();
      return {
        x: cardRect.left - sectionRect.left,
        y: cardRect.top - sectionRect.top,
        sw: sectionRect.width,
        sh: sectionRect.height,
      };
    });
    setPositions(newPositions);
  }, [sectionRef, cardRefs]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new ResizeObserver(() => {
      updatePositions();
    });
    observer.observe(section);

    // Also listen to image load and window events to handle layout shifts
    window.addEventListener('resize', updatePositions);
    window.addEventListener('load', updatePositions);

    // Initial triggers for layout shifts
    updatePositions();
    const t1 = setTimeout(updatePositions, 100);
    const t2 = setTimeout(updatePositions, 400);
    const t3 = setTimeout(updatePositions, 800);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('load', updatePositions);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [sectionRef, updatePositions]);

  return positions;
};

/**
 * Hook: useImageWidth
 * Loads background image and calculates its aspect-scaled render width.
 */
const useImageWidth = (imageUrl: string, sectionHeight: number) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
  }, [imageUrl]);

  if (aspectRatio === null || sectionHeight === 0) return 0;
  return sectionHeight * aspectRatio;
};

/**
 * Hook: useIsMobile
 * Standard hook for tracking media query breakpoints.
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    setIsMobile(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, []);

  return isMobile;
};

/**
 * Hook: useStaggeredReveal
 * Intersection observer utility returning transitions triggered sequentially.
 */
const useStaggeredReveal = (count: number, threshold = 0.15) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(element);
      }
    }, { threshold });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const getAnimStyle = (index: number): React.CSSProperties => {
    const delay = index * 120;
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    };
  };

  return { containerRef, getAnimStyle };
};

// ==========================================
// MASKED CARD COMPONENT
// ==========================================

interface MaskedCardProps {
  bgImage: string;
  position?: MaskPosition;
  imageWidth: number;
  focalX: number;
  className?: string;
  children?: React.ReactNode;
  cardRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  id?: string;
}

const MaskedCard: React.FC<MaskedCardProps> = ({
  bgImage,
  position,
  imageWidth,
  focalX,
  className = '',
  children,
  cardRef,
  style = {},
  id,
}) => {
  const pos = position || { x: 0, y: 0, sw: 0, sh: 0 };
  const overflow = imageWidth > pos.sw ? imageWidth - pos.sw : 0;
  const focalOffset = overflow * focalX;

  const inlineStyle: React.CSSProperties = pos.sh > 0 ? {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: `auto ${pos.sh}px`,
    backgroundPosition: `${-(pos.x + focalOffset)}px ${-pos.y}px`,
    backgroundRepeat: 'no-repeat',
    ...style,
  } : {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    ...style,
  };

  return (
    <div
      id={id}
      ref={cardRef}
      className={className}
      style={inlineStyle}
    >
      {children}
    </div>
  );
};

// ==========================================
// SPLASH SCREEN COMPONENT
// ==========================================

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => {
            onComplete();
          }, 700);
        }, 200);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      id="splash-screen"
      className={`fixed inset-0 bg-white z-[100] flex items-end justify-start transition-opacity duration-700 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-7xl md:text-9xl font-bold tabular-nums p-6 md:p-10 leading-none text-black select-none">
        {count}
      </div>
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [servicesState, setServicesState] = useState(initialServices);

  const isMobile = useIsMobile();

  // References for sections to compute masks & animations
  const section1Ref = useRef<HTMLElement | null>(null);
  const s1CardRefs = useRef<(HTMLElement | null)[]>([]);
  const s1Positions = useMaskPositions(section1Ref, s1CardRefs);
  const s1Height = s1Positions[0]?.sh || 0;
  const s1ImgWidth = useImageWidth(HERO_IMAGE, s1Height);
  const s1FocalX = isMobile ? 0.7 : 0.8;
  const s1Reveal = useStaggeredReveal(4, 0.1);

  const section2Ref = useRef<HTMLElement | null>(null);
  const s2CardRefs = useRef<(HTMLElement | null)[]>([]);
  const s2Positions = useMaskPositions(section2Ref, s2CardRefs);
  const s2Height = s2Positions[0]?.sh || 0;
  const s2ImgWidth = useImageWidth(SECTION2_IMAGE, s2Height);
  const s2FocalX = isMobile ? 0.65 : 0.8;
  const s2Reveal = useStaggeredReveal(4, 0.1);

  const section3Ref = useRef<HTMLElement | null>(null);
  const s3Reveal = useStaggeredReveal(4, 0.1);

  // Manage body scroll locks on mobile navigation overlay
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Smooth scrolling action to sections
  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    setIsMenuOpen(false);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSectionRef = (link: string) => {
    if (link === 'Home') return section1Ref;
    if (link === 'Services' || link === 'Gallery') return section2Ref;
    if (link === 'About' || link === 'Contact') return section3Ref;
    return section1Ref;
  };

  const handleServiceClick = (index: number) => {
    setServicesState(
      servicesState.map((svc, idx) => ({
        ...svc,
        active: idx === index,
      }))
    );
  };

  return (
    <div className="bg-white text-black min-h-screen relative selection:bg-neutral-200">
      {/* 1. Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 2. Fixed Navbar */}
      <nav id="navbar" className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        {/* Logo block */}
        <div 
          onClick={() => scrollToSection(section1Ref)} 
          className="flex flex-col cursor-pointer select-none"
          id="nav-logo"
        >
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none text-black">
            Dental
          </span>
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none text-black -mt-1.5 md:-mt-2">
            Health
          </span>
          <span className="text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2 uppercase text-neutral-500 tracking-wider">
            quality healthcare
          </span>
        </div>

        {/* Desktop Navigation Links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6" id="desktop-nav">
          <span className="text-sm font-semibold text-black flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Dental Emergency: +1 (555) 0199
          </span>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="px-6 py-3 bg-white rounded-full border border-black text-sm font-semibold hover:bg-black hover:text-white transition-colors duration-200 shadow-sm cursor-pointer"
            id="desktop-menu-btn"
          >
            Menu
          </button>
        </div>

        {/* Mobile Hamburger menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 flex items-center justify-center relative md:hidden focus:outline-none cursor-pointer z-50"
          aria-label="Toggle Menu"
          id="mobile-menu-trigger"
        >
          <span className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'}`} />
          <span className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'}`} />
          <span className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'}`} />
        </button>
      </nav>

      {/* 3. Mobile Navigation Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-500 ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        id="mobile-menu-overlay"
      >
        {/* Backdrop filter */}
        <div 
          onClick={() => setIsMenuOpen(false)}
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
        />

        {/* Slide-out Panel */}
        <div 
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col justify-between p-8 pt-24 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Nav links */}
          <div className="flex flex-col gap-5 justify-center h-full">
            {navLinks.map((link, i) => (
              <button
                key={link}
                onClick={() => scrollToSection(getSectionRef(link))}
                className={`text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] text-left cursor-pointer ${
                  isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ transitionDelay: `${100 + i * 60}ms` }}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Bottom Call to Action and Emergency details */}
          <div 
            className={`mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '450ms' }}
          >
            <p className="text-sm font-semibold text-black mb-1">
              Dental Emergency Support
            </p>
            <p className="text-xs text-neutral-500 font-medium mb-4">
              Available 24 hours / 7 days a week
            </p>
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                if (section3Ref.current) {
                  section3Ref.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200 text-center cursor-pointer"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECTION 1 - HERO
          ========================================== */}
      <section
        id="home"
        ref={(el) => {
          section1Ref.current = el;
          s1Reveal.containerRef.current = el;
        }}
        className="h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        {/* 3 Feature Bars */}
        {featureBars.map((bar, i) => (
          <MaskedCard
            key={bar}
            bgImage={HERO_IMAGE}
            position={s1Positions[i]}
            imageWidth={s1ImgWidth}
            focalX={s1FocalX}
            cardRef={(el) => {
              s1CardRefs.current[i] = el;
            }}
            className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative shadow-sm border border-black/5"
            style={s1Reveal.getAnimStyle(i)}
            id={`hero-bar-${i}`}
          >
            <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            <span className="flex items-center justify-center h-full text-black text-lg md:text-3xl font-extrabold text-center relative z-10 select-none px-4">
              {bar}
            </span>
          </MaskedCard>
        ))}

        {/* Main Hero Card (4th element, index 3) */}
        <MaskedCard
          bgImage={HERO_IMAGE}
          position={s1Positions[3]}
          imageWidth={s1ImgWidth}
          focalX={s1FocalX}
          cardRef={(el) => {
            s1CardRefs.current[3] = el;
          }}
          className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative shadow-md border border-black/5"
          style={s1Reveal.getAnimStyle(3)}
          id="hero-main-card"
        >
          {/* Subtle overlay for contrast */}
          <div className="absolute inset-0 bg-black/10" />

          {/* Top-left text */}
          <div className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10 bg-white/40 backdrop-blur-sm p-3 rounded-lg select-none">
            We wish to provide professional dental services <br />
            that match the current technologies
          </div>

          {/* Bottom-left block */}
          <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10 text-left">
            <span className="block text-black text-xs md:text-sm font-bold mb-1 md:mb-2 bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit uppercase select-none">
              Trusted Dentist in West New York
            </span>
            <h1 className="text-black text-[clamp(3rem,11vw,11rem)] font-extrabold leading-[0.79] tracking-tight uppercase select-none drop-shadow-sm">
              Dental <br /> Care
            </h1>
          </div>

          {/* Bottom-right text */}
          <div className="absolute bottom-6 right-4 md:bottom-10 md:right-8 text-white text-xs md:text-sm font-bold z-10 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full uppercase tracking-wider select-none">
            Free Consultation
          </div>
        </MaskedCard>
      </section>

      {/* ==========================================
          SECTION 2 - SMILE GALLERY
          ========================================== */}
      <section
        id="services"
        ref={(el) => {
          section2Ref.current = el;
          s2Reveal.containerRef.current = el;
        }}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
          
          {/* Card 0 - Top Left ("Smile Gallery") */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[0]}
            imageWidth={s2ImgWidth}
            focalX={s2FocalX}
            cardRef={(el) => {
              s2CardRefs.current[0] = el;
            }}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0 shadow-sm border border-black/5"
            style={s2Reveal.getAnimStyle(0)}
            id="gallery-card-0"
          >
            <div className="absolute inset-0 bg-black/5" />
            <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-4xl font-extrabold z-10 uppercase tracking-tight">
              Smile Gallery
            </h2>
            <p className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-bold z-10 uppercase tracking-wide bg-black/10 md:bg-transparent px-2 py-0.5 rounded">
              Our cosmetic dental work
            </p>
          </MaskedCard>

          {/* Card 1 - Top Right (Spans 2 rows on desktop) */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[1]}
            imageWidth={s2ImgWidth}
            focalX={s2FocalX}
            cardRef={(el) => {
              s2CardRefs.current[1] = el;
            }}
            className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0 shadow-sm border border-black/5"
            style={s2Reveal.getAnimStyle(1)}
            id="gallery-card-1"
          >
            <div className="absolute inset-0 bg-black/15" />
            <p className="absolute bottom-16 left-5 md:bottom-24 md:left-7 text-white text-xs md:text-base font-bold leading-4 md:leading-6 z-10 max-w-[280px] md:max-w-md bg-black/20 p-3 rounded-lg backdrop-blur-sm">
              If you want a gorgeous smile, <br />
              call us to ask about a smile makeover.
            </p>
            <button
              onClick={() => window.open('tel:+15550199')}
              className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-extrabold z-10 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-md uppercase"
            >
              Call Us
            </button>
          </MaskedCard>

          {/* Card 2 - Bottom Left ("Smile makeover") */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[2]}
            imageWidth={s2ImgWidth}
            focalX={s2FocalX}
            cardRef={(el) => {
              s2CardRefs.current[2] = el;
            }}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0 shadow-sm border border-black/5"
            style={s2Reveal.getAnimStyle(2)}
            id="gallery-card-2"
          >
            <div className="absolute inset-0 bg-black/10" />
            <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(2.5rem,7vw,6rem)] font-extrabold leading-[0.9] z-10 uppercase tracking-tighter">
              Smile <br /> makeover
            </h2>
          </MaskedCard>

          {/* Card 3 - Bottom Full Width (Services list) */}
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            position={s2Positions[3]}
            imageWidth={s2ImgWidth}
            focalX={s2FocalX}
            cardRef={(el) => {
              s2CardRefs.current[3] = el;
            }}
            className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[220px] md:min-h-0 shadow-md border border-black/5"
            style={s2Reveal.getAnimStyle(3)}
            id="gallery-card-3"
          >
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[1px]" />
            <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3 overflow-y-auto md:overflow-hidden">
              {servicesState.map((svc, idx) => (
                <div
                  key={svc.name}
                  onClick={() => handleServiceClick(idx)}
                  className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer border select-none ${
                    svc.active
                      ? 'bg-white/95 backdrop-blur-md border-white text-black scale-[1.01]'
                      : 'bg-white/15 backdrop-blur-xl border-white/10 text-white hover:bg-white/20'
                  }`}
                  id={`service-card-${idx}`}
                >
                  <h3 className="text-sm md:text-2xl font-extrabold leading-[1.05] whitespace-pre-line uppercase tracking-tight">
                    {svc.name}
                  </h3>
                  {svc.num ? (
                    <div
                      className={`self-end w-8 h-8 md:w-11 md:h-11 rounded-full border flex items-center justify-center text-xs md:text-sm font-extrabold transition-colors ${
                        svc.active
                          ? 'border-black text-black bg-neutral-50'
                          : 'border-white text-white'
                      }`}
                    >
                      {svc.num}
                    </div>
                  ) : (
                    <div className="self-end w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-400 mr-2 mb-2 animate-ping" />
                  )}
                </div>
              ))}
            </div>
          </MaskedCard>

        </div>
      </section>

      {/* ==========================================
          SECTION 3 - IMPLANT DENTISTRY
          ========================================== */}
      <section
        id="about"
        ref={s3Reveal.containerRef}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-1.5 md:gap-2 h-full justify-between">
            
            {/* Heading Card */}
            <div 
              className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0 border border-neutral-100 shadow-sm"
              style={s3Reveal.getAnimStyle(0)}
              id="implant-heading-card"
            >
              <h2 className="text-[clamp(2.5rem,7vw,6.5rem)] font-extrabold leading-[0.95] text-black uppercase tracking-tighter">
                Implant <br /> Dentistry
              </h2>
              <p className="text-xs md:text-sm font-bold text-neutral-500 uppercase tracking-wider">
                Restore Missing Teeth
              </p>
            </div>

            {/* Two Image Cards side-by-side */}
            <div 
              className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0"
              style={s3Reveal.getAnimStyle(1)}
              id="implant-images-row"
            >
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-neutral-100 relative group">
                <img
                  src={SECTION3_IMG1}
                  alt="Dental implant procedure"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden shadow-sm border border-neutral-100 relative group">
                <img
                  src={SECTION3_IMG2}
                  alt="Dental restoration"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Consultation Card */}
            <div 
              className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0 shadow-sm"
              style={s3Reveal.getAnimStyle(2)}
              id="implant-consult-card"
            >
              <div className="text-left">
                <p className="text-xs md:text-sm font-bold text-neutral-600 mb-2 md:mb-3 uppercase tracking-wider">
                  Consultation
                </p>
                <h3 className="text-xl md:text-3xl font-extrabold text-black leading-6 md:leading-8 uppercase tracking-tight">
                  Dental <br /> Restoration <br /> Services
                </h3>
              </div>
              <button
                onClick={() => {
                  if (section3Ref.current) {
                    section3Ref.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-extrabold hover:scale-105 transition-transform duration-200 cursor-pointer shadow-md uppercase"
              >
                Book Online
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div 
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0 shadow-md border border-neutral-100 group"
            style={s3Reveal.getAnimStyle(3)}
            id="implant-right-column"
          >
            <img
              src={SECTION3_BG}
              alt="Smiling patient"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              loading="lazy"
            />
            
            {/* Overlay Container with Arrow Cards */}
            <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
              
              {/* Overlay Card 1 - White, left */}
              <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52 shadow-lg border border-neutral-100 select-none">
                <h4 className="text-sm md:text-xl font-extrabold text-black leading-4 md:leading-6 uppercase tracking-tight">
                  The Process <br /> of Installing <br /> Implants
                </h4>
                <div 
                  className="self-end w-9 h-9 md:w-11 md:h-11 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
                  aria-label="View Installation Process"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="rotate-[-45deg] w-4 h-4 md:w-5 md:h-5"
                  >
                    <path
                      d="M1 7h12m0 0L8 2m5 5L8 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Overlay Card 2 - Glass, right */}
              <div className="flex-1 bg-white/25 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52 shadow-lg border border-white/10 select-none">
                <h4 className="text-sm md:text-xl font-extrabold text-white leading-4 md:leading-6 uppercase tracking-tight">
                  Caring <br /> for Dental <br /> Implants
                </h4>
                <div 
                  className="self-end w-9 h-9 md:w-11 md:h-11 rounded-full border border-white flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer text-white"
                  aria-label="View Care Guide"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="rotate-[-45deg] w-4 h-4 md:w-5 md:h-5 text-white"
                  >
                    <path
                      d="M1 7h12m0 0L8 2m5 5L8 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
