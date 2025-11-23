import React, { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion";


const EmblaCarousel = ({ images = [], options }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [currentIndex, setCurrentIndex] = useState(0)



  // Update currentIndex when the carousel slides
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()
  const scrollToIndex = (index) => emblaApi && emblaApi.scrollTo(index)

  return (
    <div className="max-w-4xl mx-auto mt-16 px-4">

      {/* Carousel */}
      <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
        <div className="flex -ml-6 sm:-ml-8">
          {images.map((image, index) => (
            <div
              className="flex-[0_0_70%] min-w-0 pl-6 sm:pl-8 translate-z-0 relative"
              key={index}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]" onClick={() => scrollToIndex(index)}>
                <img
                  src={image.source}
                  alt={image.title}
                  className="block h-[19rem] w-full object-cover"
                />

                {/* Soft Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50" />

                {/* CTA Button */}
                
                <button className="
                  absolute bottom-4 left-1/2 sm:bottom-4 -translate-x-1/2
                  bg-white/90 text-gray-900
                  font-medium py-2 px-5 rounded-full
                  shadow hover:bg-white transition-colors
                  backdrop-blur-md
                  text-xs sm:text-sm whitespace-nowrap
                ">
              
                  Improve your game today →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animated Title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center mt-10"
        >
          <h3 className="
        text-2xl sm:text-5xl font-semibold 
        tracking-tight text-white
      ">
            {images[currentIndex]?.title}
          </h3>

          <p className="mt-3 text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
            {images[currentIndex]?.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-center items-center gap-6 mt-10">
        <button
          onClick={scrollPrev}
          className="
        p-2 sm:p-3 rounded-full bg-white/10 
        hover:bg-white/20 border border-white/10
        transition-all backdrop-blur-md
      "
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={scrollNext}
          className="
        p-2 sm:p-3 rounded-full bg-white/10 
        hover:bg-white/20 border border-white/10
        transition-all backdrop-blur-md
      "
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

    </div>
  )
}

export default EmblaCarousel
