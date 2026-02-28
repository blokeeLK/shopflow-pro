import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Slide {
  id: string;
  image: string;
  link: string | null;
  position: number | null;
  active: boolean;
}

export function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  useEffect(() => {
    supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("position")
      .then(({ data }) => {
        if (data && data.length > 0) setSlides(data);
      });
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Fallback
  if (slides.length === 0) {
    return (
      <section className="w-full">
        <div className="w-full" style={{ aspectRatio: '1920/550' }}>
          <img
            src="/images/banner-nova-colecao.png"
            alt="Nova Coleção - Estilo que fala por você"
            className="block w-full h-full object-cover"
          />
        </div>
      </section>
    );
  }

  const SlideImage = ({ slide }: { slide: Slide }) => (
    <div className="w-full" style={{ aspectRatio: '1920/550' }}>
      <img
        src={slide.image}
        alt="Banner"
        className="block w-full h-full object-cover"
      />
    </div>
  );

  return (
    <section className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 transition-opacity duration-500 ease-in-out"
              style={{ opacity: i === selectedIndex ? 1 : 0.4 }}
            >
              {slide.link ? (
                <Link to={slide.link}>
                  <SlideImage slide={slide} />
                </Link>
              ) : (
                <SlideImage slide={slide} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/90 text-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === selectedIndex ? "bg-accent scale-125" : "bg-background/60"
              }`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
