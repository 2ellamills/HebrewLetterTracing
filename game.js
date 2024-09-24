const handIcon = new Image();
handIcon.src = 'graphics/point.png'; 

let animationId = null;


function animateHand(start, end, duration) {
    const startTime = performance.now();
    
    function step(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        const x = start.x + (end.x - start.x) * progress;
        const y = start.y + (end.y - start.y) * progress;
        
        redraw();
        ctx.drawImage(handIcon, x - 20, y - 20, 50, 50);  // צייר את האייקון בגודל 50x50
        
        if (progress < 1) {
            animationId = requestAnimationFrame(step);
        } else {
            animationId = null;
        }
    }
    
    animationId = requestAnimationFrame(step);
}

function startHandAnimation() {
    if (currentLineIndex < lines.length) {
        const currentLine = lines[currentLineIndex];
        animateHand(currentLine.start, currentLine.end, 2000);  // אנימציה של 2 שניות
    }
}

function stopHandAnimation() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const letterPath = [
    {x: 260, y: 130},  // Top left corner
    {x: 560, y: 460},  // Bottom right corner
    {x: 550, y: 130},  // Top right
    {x: 465, y: 340},  // Intersection point of right line
    {x: 250, y: 100},  // Back to top left
    {x: 340, y: 230},  // Intersection point of left line
    {x: 280, y: 480}   // Bottom left corner
];

let isDrawing = false;
let currentDrawingPath = [];
let completedPaths = [];

const lines = [
    {start: letterPath[0], end: letterPath[1], completed: false},
    {start: letterPath[2], end: letterPath[3], completed: false},
    {start: letterPath[5], end: letterPath[6], completed: false}
];

let currentLineIndex = 0;

function drawLetter() {
    ctx.beginPath();
    
    lines.forEach(line => {
        ctx.moveTo(line.start.x, line.start.y);
        ctx.lineTo(line.end.x, line.end.y);
    });

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';  // הוספנו את זה
    ctx.lineJoin = 'round'; // הוספנו את זה
    ctx.stroke();
    
    ctx.lineWidth = 50;
    ctx.strokeStyle = 'white';
    ctx.stroke();

    // מאפסים את ההגדרות
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
}

function drawGuideLine(start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 15]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - 15 * Math.cos(angle - Math.PI / 6), end.y - 15 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - 15 * Math.cos(angle + Math.PI / 6), end.y - 15 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fill();
}

function isPointInPath(x, y, checkNextLine = false) {
    const normalTolerance = 30;
    const endpointTolerance = 60;  // Increased tolerance for start and end points
    
    for (let i = currentLineIndex; i < (checkNextLine ? currentLineIndex + 2 : currentLineIndex + 1); i++) {
        if (i >= lines.length) break;
        const line = lines[i];
        const dist = distToLine({x, y}, line.start, line.end);
        
        // Check if point is near start or end of the line
        const distToStart = Math.hypot(x - line.start.x, y - line.start.y);
        const distToEnd = Math.hypot(x - line.end.x, y - line.end.y);
        
        if (dist < normalTolerance || 
            distToStart < endpointTolerance || 
            distToEnd < endpointTolerance) {
            return i;
        }
    }
    return -1;
}

function distToLine(p, start, end) {
    const A = p.x - start.x;
    const B = p.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = start.x;
        yy = start.y;
    }
    else if (param > 1) {
        xx = end.x;
        yy = end.y;
    }
    else {
        xx = start.x + param * C;
        yy = start.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function drawUserPaths() {
    // Draw completed paths
    ctx.beginPath();
    completedPaths.forEach(path => {
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
    });
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw current path
    if (currentDrawingPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentDrawingPath[0].x, currentDrawingPath[0].y);
        currentDrawingPath.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = 'rgb(87, 3, 133)'; //purple
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    // מאפסים את ההגדרות
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
}

function startDrawing(e) {
    stopHandAnimation();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lineIndex = isPointInPath(x, y, true);
    if (lineIndex === currentLineIndex || lineIndex === currentLineIndex + 1) {
        isDrawing = true;
        currentDrawingPath = [{x, y}];
        if (lineIndex === currentLineIndex + 1) {
            currentLineIndex++;
        }
    }
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lineIndex = isPointInPath(x, y, true);
    if (lineIndex === currentLineIndex || lineIndex === currentLineIndex + 1) {
        currentDrawingPath.push({x, y});
    } else {
        stopDrawing();
    }

    redraw();
}


const CONFETTI_COUNT = 100;
const COLORS = ['#0000FF', '#00FF00', '#FF0000', '#FF69B4']; // כחול, ירוק, אדום, ורוד

function createConfettiParticles() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particles = [];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({
            x: centerX,
            y: centerY,
            radius: 5 + Math.random() * 5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 100 + Math.random() * 50
        });
    }
    return particles;
}

function updateAndDrawConfetti(particles) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLetter();
    drawUserPaths();

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        if (p.life <= 0) {
            particles.splice(index, 1);
            return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    });

    return particles.length > 0;
}

function startConfettiAnimation() {
    let particles = createConfettiParticles();
    
    function animate() {
        if (updateAndDrawConfetti(particles)) {
            requestAnimationFrame(animate);
        } else {
            // כשהאנימציה מסתיימת, נצייר מחדש את האות והקווים שצוירו
            redraw();
        }
    }
    
    animate();
}

function stopDrawing() {
    if (isDrawing && currentDrawingPath.length > 1) {
        const startPoint = currentDrawingPath[0];
        const endPoint = currentDrawingPath[currentDrawingPath.length - 1];
        const line = lines[currentLineIndex];
        
        const startDist = distToLine(startPoint, line.start, line.end);
        const endDist = distToLine(endPoint, line.start, line.end);
        const lineLengthSquared = (line.end.x - line.start.x)**2 + (line.end.y - line.start.y)**2;
        const drawnLengthSquared = (endPoint.x - startPoint.x)**2 + (endPoint.y - startPoint.y)**2;
        
        if (startDist < 60 && endDist < 60 && drawnLengthSquared > 0.64 * lineLengthSquared) {
            line.completed = true;
            completedPaths.push(currentDrawingPath);
            currentLineIndex++;
            
            if (currentLineIndex < lines.length) {
                startHandAnimation();
            } else {
                // כל הקווים הושלמו, נפעיל את אנימציית הקונפטי
                startConfettiAnimation();
            }
        }
    }
    
    isDrawing = false;
    currentDrawingPath = [];
    redraw();
}
// עדכן את פונקציית redraw
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLetter();
    drawUserPaths();
    if (currentLineIndex < lines.length && !isDrawing) {
        const currentLine = lines[currentLineIndex];
        drawGuideLine(currentLine.start, currentLine.end);
    }
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e.touches[0]);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e.touches[0]);
});
canvas.addEventListener('touchend', stopDrawing);

// Adjust canvas size
canvas.width = 800;
canvas.height = 600;

// Initial draw
redraw();

startHandAnimation();