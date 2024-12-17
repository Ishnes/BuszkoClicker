const canvas = document.getElementById('voidCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Resizing the canvas dynamically
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Particle Settings
        const particlesArray = [];
        const numberOfParticles = 150;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1; // Particle size
                this.speedX = (Math.random() - 0.5) * 0.5; // Horizontal speed
                this.speedY = (Math.random() - 0.5) * 0.5; // Vertical speed
                this.alpha = Math.random();
                this.fadeSpeed = Math.random() * 0.01 + 0.005;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.alpha -= this.fadeSpeed; // Slowly fade particles out
                if (this.alpha <= 0) {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                    this.alpha = 1; // Reset the alpha
                }
            }
            draw() {
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White particles
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            }
        }

        // Initialize particles
        function init() {
            for (let i = 0; i < numberOfParticles; i++) {
                particlesArray.push(new Particle());
            }
        }

        // Animate particles
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Slight black overlay
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particlesArray.forEach(particle => {
                particle.update();
                particle.draw();
            });

            requestAnimationFrame(animate);
        }

        init();
        animate();

