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
}

.comfy-carousel-box .slides img.shown {
    display: block;
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
        $: (el) => el.addEventListener('click', (e) => prevSlide(e), true), 
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