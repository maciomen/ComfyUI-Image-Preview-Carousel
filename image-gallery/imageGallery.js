import { app } from "/scripts/app.js";
import { $el, ComfyDialog } from "/scripts/ui.js";

var styles = `
.comfy-carousel {
	display: none; /* Hidden by default */
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0%;
    left: 0%;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
}

.comfy-carousel-box {
    margin: 0 auto 20px;
    text-align: center;
}
  
.comfy-carousel-box .slides {
    position: relative;
}
                
.comfy-carousel-box .slides img {
    display: none;
    max-height: 90vh;
    max-width: 90vw;
    margin: auto;
    transition: transform 0.15s ease, transform-origin 0.01s ease; /* Smooth transition for the zoom effect */
    cursor: pointer; /* Pointer cursor on hover */
}

.comfy-carousel-box .slides img.shown {
    display: block;
}

.comfy-carousel-box .slides img.zoomed {
    transform: scale(3); /* Zoom level */
}

.comfy-carousel-box .prev:before,
.comfy-carousel-box .next:before {
    color: #fff;
    font-size: 100px;
    position: absolute;
    top: 35%;
    cursor: pointer;
}

.comfy-carousel-box .prev:before {
    content: '❮';
    left: 0;
}
  
.comfy-carousel-box .next:before {
    content: '❯';
    right: 0;
}

.comfy-carousel-box .dots img {
    height: 32px;
    margin: 8px 0 0 8px;
    opacity: 0.6;
}

.comfy-carousel-box .dots img:hover {
    opacity: 0.8;
}

.comfy-carousel-box .dots img.active {
    opacity: 1;
}
`

var styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = styles
document.head.appendChild(styleSheet)

class ComfyCarousel extends ComfyDialog {
  constructor() {
		super();
		this.element.classList.toggle("comfy-modal");
		this.element.classList.toggle("comfy-carousel");
    this.element.addEventListener('click', (e) => {
      this.close();
    });
	}
  createButtons() {
    return [];
  }
  isOpen() {
    return this.element.style.display == "flex";
  }
  isClosed() {
    return this.element.style.display != "flex";
  }
}

app.registerExtension({
  name: "Comfy.ImageGallery",
  init() {
    app.ui.carousel = new ComfyCarousel();
  },
  beforeRegisterNodeDef(nodeType, nodeData) {
	if (nodeData.name === "SaveImage" || nodeData.name === "PreviewImage") {
      const addZoom = (main) => {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let moveX = 0;
        let moveY = 0;
        let lastTranslateX = 0;
        let lastTranslateY = 0;

        main.addEventListener('mousedown', (event) => {
          event.preventDefault();
          let img = main.querySelector('.shown');
          if (!img.classList.contains('zoomed')) return;

          isDragging = true;
          const rect = img.getBoundingClientRect();
          startX = event.clientX - rect.left;
          startY = event.clientY - rect.top;
        });

        document.addEventListener('mousemove', (event) => {
          let img = main.querySelector('.shown');

          const isZoomed = img?.classList.contains('zoomed');
          if (!isDragging || !isZoomed ) return;
          event.preventDefault();
          event.stopPropagation();

          const rect = img.getBoundingClientRect();
          moveX = (event.clientX - rect.left - startX) * 2;
          moveY = (event.clientY - rect.top - startY) * 2;

          let currentScale = getCurrentScale(img.style.transform);
          // Apply the movement as translation, adding to the last translation
          img.style.transform = `scale(${currentScale}) translate(${lastTranslateX + moveX}px, ${lastTranslateY + moveY}px)`;
        });

        document.addEventListener('mouseup', (event) => {
          if (!isDragging) return;
          isDragging = false;

          lastTranslateX += moveX;
          lastTranslateY += moveY;
          moveX = 0;
          moveY = 0;
        });


        main.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
        });

        main.addEventListener('wheel', (event) => {
          let img = slides.querySelector('.shown');
          event.preventDefault(); // Prevent the page from scrolling
          event.stopPropagation();
      
          // Determine the direction of the scroll and adjust the scale accordingly
          const scaleIncrement = 0.3; // Adjust this value to control the zoom speed
          const currentScale = getCurrentScale(img.style.transform);
          let newScale = event.deltaY < 0 ? currentScale + scaleIncrement : currentScale - scaleIncrement;
      
          newScale = Math.min(Math.max(newScale, 1), 10);          

          if (newScale > 1) {
            img.style.transform = `scale(${newScale}) translate(${lastTranslateX}px, ${lastTranslateY}px)`;
          }
      
          // Toggle the 'zoomed' class based on the new scale
          if (newScale > 1 && !img.classList.contains('zoomed')) {
            img.classList.add('zoomed');
          } else if (newScale <= 1 && img.classList.contains('zoomed')) {
            img.classList.remove('zoomed');
            img.style.transform = `scale(1) translate(0px, 0px)`;
            lastTranslateX = 0;
            lastTranslateY = 0;
          }
        });
      }

      const getActive = () => {
        const active = slides.querySelector('.shown');
        const imageIndex = [...slides.childNodes].indexOf(active);

        return [active, imageIndex];
      }
      const selectImage = (id) => {
        const [_, imageIndex] = getActive();
        if (imageIndex !== -1) {
          slides.childNodes[imageIndex].classList.toggle('shown');
          dots.childNodes[imageIndex].classList.toggle('active');
        }

        slides.childNodes[id].classList.toggle('shown');
        dots.childNodes[id].classList.toggle('active');
      }
      const slideN = (n) => {
        const [_, imageIndex] = getActive();

        let nth = imageIndex + n;
        if (nth < 0) nth = slides.childNodes.length - 1;
        else if (nth >= slides.childNodes.length) nth = 0;

        selectImage(nth);
      }
      const prevSlide = (e) => {
        slideN(-1);
        e.stopPropagation();
      }
      const nextSlide = (e) => {
        slideN(1);
        e.stopPropagation();
      }

      const slides = $el("div.slides");
      const dots = $el("div.dots");
      const carousel = $el("div.comfy-carousel-box", { 
        $: (el) => {
          addZoom(el);
        }, 
      }, [
        slides,
        dots,
        $el("a.prev", { $: (el) => el.addEventListener('click', (e) => prevSlide(e), true), }),
        $el("a.next", { $: (el) => el.addEventListener('click', (e) => nextSlide(e), true), }),
      ]);

      nodeType.prototype.openCarousel = function (onlyIfOpen = true) {
        if (onlyIfOpen && app.ui.carousel.isClosed()) return;

        slides.innerHTML = "";
        dots.innerHTML = "";

        let img;
        if (this.imgs && this.imgs.length) {
          if (this.imgs.length === 2) {
            for (let i = 0; i < this.imgs.length - 1; i++) {
              img = mergeImages(this.imgs[i], this.imgs[i+1]);
            }
          } else {
            img = this.imgs[0];
          }


          slides.append(img.cloneNode(true));
          dots.append(img.cloneNode(true));
          selectImage(0);
          app.ui.carousel.show(carousel);
        }
      }

      nodeType.prototype.onMouseUp = function (e, pos, graph) {
        this.openCarousel(false);
      }

      nodeType.prototype.setSizeForImage = (function(_super) {
        return function(force) {
          this.openCarousel();
          return _super.apply(this, arguments);
        };
     })(nodeType.prototype.setSizeForImage);
    }
  },
});

function mergeImages(image1, image2) {
  let canvas = document.createElement('canvas');
  let ctx = canvas.getContext('2d');

  // Set canvas dimensions
  canvas.width = image1.width + image2.width;
  canvas.height = Math.max(image1.height, image2.height);

  // Draw images onto canvas
  ctx.drawImage(image1, 0, 0);
  ctx.drawImage(image2, image1.width + 5, 0);

  // Get the resulting image as a data URL
  let dataURL = canvas.toDataURL();
  const out = new Image();
  out.src = dataURL;

  return out;
}

function getCurrentScale(transform) {
  const match = transform.match(/scale\(([^)]+)\)/);
  return match ? parseFloat(match[1]) : 1;
}

function getCurrentTransformOriginX(transform) {
  const match = transform.match(/transform-origin:\s*([^%]+)%/);
  return match ? parseFloat(match[1]) : 0;
}

function getCurrentTransformOriginY(transform) {
  const match = transform.match(/transform-origin:\s*[^%]+\s+([^%]+)%/);
  return match ? parseFloat(match[1]) : 0;
}