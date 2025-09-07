// Глобальные переменные
let currentInput = '';
let calculationHistory = [];
let graphScale = 1;
let graphOffsetX = 0;
let graphOffsetY = 0;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeEventListeners();
    updateDisplay();
});

// Инициализация вкладок
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Убираем активный класс у всех кнопок и вкладок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Добавляем активный класс к выбранной вкладке
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Обработчик нажатий клавиш для основного калькулятора
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Обработчик для кнопки удаления символа
    const display = document.getElementById('display');
    display.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace') {
            e.preventDefault();
            backspace();
        }
    });
}

// Функции основного калькулятора
function appendToDisplay(value) {
    const display = document.getElementById('display');
    
    if (value === '←') {
        // Удаление последнего символа
        display.value = display.value.slice(0, -1);
        currentInput = display.value;
    } else if (value === 'C') {
        // Полная очистка
        clearDisplay();
    } else if (value === 'CE') {
        // Очистка текущего ввода
        display.value = '';
        currentInput = '';
    } else {
        // Добавление символа к вводу
        display.value += value;
        currentInput = display.value;
    }
    
    updateDisplay();
}

function clearDisplay() {
    const display = document.getElementById('display');
    const result = document.getElementById('result');
    const history = document.querySelector('.history');
    
    display.value = '';
    result.textContent = '';
    currentInput = '';
    calculationHistory = [];
    history.innerHTML = '';
}

function clearEntry() {
    const display = document.getElementById('display');
    display.value = '';
    currentInput = '';
}

function backspace() {
    const display = document.getElementById('display');
    display.value = display.value.slice(0, -1);
    currentInput = display.value;
}

function calculate() {
    const display = document.getElementById('display');
    const result = document.getElementById('result');
    const history = document.querySelector('.history');
    
    if (!display.value.trim()) return;
    
    try {
        // Заменяем символы для совместимости с math.js
        let expression = display.value
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, 'pi')
            .replace(/√/g, 'sqrt');
        
        // Вычисляем результат
        const calculationResult = math.evaluate(expression);
        
        // Форматируем результат с высокой точностью (20 знаков) и без экспоненциального формата
        let formattedResult;
        if (typeof calculationResult === 'number') {
            // Для больших чисел используем toFixed вместо экспоненциального формата
            if (Math.abs(calculationResult) >= 1e6 || (Math.abs(calculationResult) < 1e-6 && calculationResult !== 0)) {
                formattedResult = calculationResult.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 20 });
            } else {
                formattedResult = math.format(calculationResult, { precision: 20, notation: 'fixed' });
            }
        } else if (calculationResult && typeof calculationResult === 'object' && calculationResult.re !== undefined) {
            // Комплексное число
            const realPart = math.format(calculationResult.re, { precision: 20, notation: 'fixed' });
            const imagPart = math.format(calculationResult.im, { precision: 20, notation: 'fixed' });
            formattedResult = `${realPart} + ${imagPart}i`;
        } else {
            formattedResult = math.format(calculationResult, { precision: 20, notation: 'fixed' });
        }
        
        result.textContent = formattedResult;
        
        // Добавляем в историю
        calculationHistory.push(`${display.value} = ${formattedResult}`);
        if (calculationHistory.length > 5) {
            calculationHistory.shift();
        }
        
        // Обновляем историю на экране
        history.innerHTML = calculationHistory.map(item => 
            `<div>${item}</div>`
        ).join('');
        
        // Сохраняем результат в текущий ввод для дальнейших вычислений
        currentInput = formattedResult;
        display.value = formattedResult;
        
    } catch (error) {
        result.textContent = 'Ошибка';
        console.error('Ошибка вычисления:', error);
    }
}

function updateDisplay() {
    const display = document.getElementById('display');
    display.value = currentInput;
}

function handleKeyboardInput(e) {
    const display = document.getElementById('display');
    const result = document.getElementById('result');
    
    // Игнорируем нажатия, если не находимся на вкладке калькулятора
    if (!document.getElementById('calculator').classList.contains('active')) return;
    
    if (e.key >= '0' && e.key <= '9') {
        appendToDisplay(e.key);
    } else if (['+', '-', '*', '/'].includes(e.key)) {
        appendToDisplay(e.key);
    } else if (e.key === '.') {
        appendToDisplay('.');
    } else if (e.key === '(' || e.key === ')') {
        appendToDisplay(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
    } else if (e.key === 'Escape') {
        clearDisplay();
    } else if (e.key === 'Backspace') {
        backspace();
    } else if (e.key === '^') {
        appendToDisplay('^');
    }
}

// Функции для графиков
function plotFunctions() {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    const func1 = document.getElementById('functionInput').value || 'sin(x)';
    const func2 = document.getElementById('functionInput2').value || 'cos(x)';
    const xMin = parseFloat(document.getElementById('xMin').value) || -10;
    const xMax = parseFloat(document.getElementById('xMax').value) || 10;
    const yMin = parseFloat(document.getElementById('yMin').value) || -5;
    const yMax = parseFloat(document.getElementById('yMax').value) || 5;
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем координатную сетку
    drawGrid(ctx, canvas.width, canvas.height, xMin, xMax, yMin, yMax);
    
    // Рисуем оси
    drawAxes(ctx, canvas.width, canvas.height, xMin, xMax, yMin, yMax);
    
    // Рисуем функции
    try {
        if (func1) {
            plotFunction(ctx, canvas.width, canvas.height, func1, xMin, xMax, yMin, yMax, '#ff6b6b');
        }
        if (func2) {
            plotFunction(ctx, canvas.width, canvas.height, func2, xMin, xMax, yMin, yMax, '#4ecdc4');
        }
        
        // Находим и рисуем точки пересечения
        if (func1 && func2) {
            findAndDrawIntersections(ctx, canvas.width, canvas.height, func1, func2, xMin, xMax, yMin, yMax);
        }
    } catch (error) {
        console.error('Ошибка построения графика:', error);
        alert('Ошибка построения графика. Проверьте правильность введенной функции.');
    }
}

function drawGrid(ctx, width, height, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    const xScale = width / (xMax - xMin);
    const yScale = height / (yMax - yMin);
    
    // Вертикальные линии
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
        if (x === 0) continue; // Пропускаем ось Y
        const canvasX = (x - xMin) * xScale;
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
        if (y === 0) continue; // Пропускаем ось X
        const canvasY = height - (y - yMin) * yScale;
        ctx.beginPath();
        ctx.moveTo(0, canvasY);
        ctx.lineTo(width, canvasY);
        ctx.stroke();
    }
}

function drawAxes(ctx, width, height, xMin, xMax, yMin, yMax) {
    const xScale = width / (xMax - xMin);
    const yScale = height / (yMax - yMin);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Ось X
    const xAxisY = height - (-yMin) * yScale;
    ctx.beginPath();
    ctx.moveTo(0, xAxisY);
    ctx.lineTo(width, xAxisY);
    ctx.stroke();
    
    // Ось Y
    const yAxisX = (-xMin) * xScale;
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, height);
    ctx.stroke();
    
    // Подписи осей
    ctx.fillStyle = '#33';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // Подписи по оси X
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += Math.max(1, Math.floor((xMax - xMin) / 10))) {
        if (x === 0) continue;
        const canvasX = (x - xMin) * xScale;
        ctx.fillText(x.toString(), canvasX, xAxisY + 15);
    }
    
    // Подписи по оси Y
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += Math.max(1, Math.floor((yMax - yMin) / 10))) {
        if (y === 0) continue;
        const canvasY = height - (y - yMin) * yScale;
        ctx.fillText(y.toString(), yAxisX - 5, canvasY + 4);
    }
    
    // Подписи 0 в начале координат
    if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) {
        ctx.textAlign = 'right';
        ctx.fillText('0', yAxisX - 5, xAxisY + 15);
    }
}

function plotFunction(ctx, width, height, funcStr, xMin, xMax, yMin, yMax, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const xScale = width / (xMax - xMin);
    const yScale = height / (yMax - yMin);
    const step = (xMax - xMin) / width;
    
    let firstPoint = true;
    
    for (let x = xMin; x <= xMax; x += step) {
        try {
            // Заменяем x в функции и вычисляем значение
            const expr = funcStr.replace(/x/g, `(${x})`);
            const y = math.evaluate(expr);
            
            if (typeof y === 'number' && isFinite(y)) {
                const canvasX = (x - xMin) * xScale;
                const canvasY = height - (y - yMin) * yScale;
                
                if (firstPoint) {
                    ctx.moveTo(canvasX, canvasY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            } else {
                firstPoint = true; // Прерываем линию при недопустимом значении
            }
        } catch (error) {
            firstPoint = true; // Прерываем линию при ошибке
        }
    }
    
    ctx.stroke();
}

function clearGraph() {
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Сбрасываем значения по умолчанию
    document.getElementById('functionInput').value = 'sin(x)';
    document.getElementById('functionInput2').value = 'cos(x)';
    document.getElementById('xMin').value = '-10';
    document.getElementById('xMax').value = '10';
    document.getElementById('yMin').value = '-5';
    document.getElementById('yMax').value = '5';
}

function zoomIn() {
    const xMin = document.getElementById('xMin');
    const xMax = document.getElementById('xMax');
    const yMin = document.getElementById('yMin');
    const yMax = document.getElementById('yMax');
    
    const currentXMin = parseFloat(xMin.value);
    const currentXMax = parseFloat(xMax.value);
    const currentYMin = parseFloat(yMin.value);
    const currentYMax = parseFloat(yMax.value);
    
    const xCenter = (currentXMin + currentXMax) / 2;
    const yCenter = (currentYMin + currentYMax) / 2;
    
    const newXRange = (currentXMax - currentXMin) * 0.8;
    const newYRange = (currentYMax - currentYMin) * 0.8;
    
    xMin.value = (xCenter - newXRange / 2).toFixed(1);
    xMax.value = (xCenter + newXRange / 2).toFixed(1);
    yMin.value = (yCenter - newYRange / 2).toFixed(1);
    yMax.value = (yCenter + newYRange / 2).toFixed(1);
    
    plotFunctions();
}

function zoomOut() {
    const xMin = document.getElementById('xMin');
    const xMax = document.getElementById('xMax');
    const yMin = document.getElementById('yMin');
    const yMax = document.getElementById('yMax');
    
    const currentXMin = parseFloat(xMin.value);
    const currentXMax = parseFloat(xMax.value);
    const currentYMin = parseFloat(yMin.value);
    const currentYMax = parseFloat(yMax.value);
    
    const xCenter = (currentXMin + currentXMax) / 2;
    const yCenter = (currentYMin + currentYMax) / 2;
    
    const newXRange = (currentXMax - currentXMin) * 1.2;
    const newYRange = (currentYMax - currentYMin) * 1.2;
    
    xMin.value = (xCenter - newXRange / 2).toFixed(1);
    xMax.value = (xCenter + newXRange / 2).toFixed(1);
    yMin.value = (yCenter - newYRange / 2).toFixed(1);
    yMax.value = (yCenter + newYRange / 2).toFixed(1);
    
    plotFunctions();
}

function resetZoom() {
    document.getElementById('xMin').value = '-10';
    document.getElementById('xMax').value = '10';
    document.getElementById('yMin').value = '-5';
    document.getElementById('yMax').value = '5';
    plotFunctions();
}

// Функция для нахождения и отображения точек пересечения
function findAndDrawIntersections(ctx, width, height, func1, func2, xMin, xMax, yMin, yMax) {
    const xScale = width / (xMax - xMin);
    const yScale = height / (yMax - yMin);
    const step = (xMax - xMin) / 1000; // Высокая точность
    
    let intersections = [];
    let prevDiff = null;
    
    // Ищем точки пересечения
    for (let x = xMin; x <= xMax; x += step) {
        try {
            const expr1 = func1.replace(/x/g, `(${x})`);
            const expr2 = func2.replace(/x/g, `(${x})`);
            
            const y1 = math.evaluate(expr1);
            const y2 = math.evaluate(expr2);
            
            if (typeof y1 === 'number' && typeof y2 === 'number' && isFinite(y1) && isFinite(y2)) {
                const diff = y1 - y2;
                
                // Проверяем смену знака разности (пересечение)
                if (prevDiff !== null && prevDiff * diff < 0) {
                    // Уточняем точку пересечения методом бисекции
                    const intersection = findIntersectionPoint(func1, func2, x - step, x, yMin, yMax);
                    if (intersection) {
                        intersections.push(intersection);
                    }
                }
                
                prevDiff = diff;
            } else {
                prevDiff = null;
            }
        } catch (error) {
            prevDiff = null;
        }
    }
    
    // Рисуем точки пересечения
    ctx.fillStyle = '#ff4757';
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    
    intersections.forEach(point => {
        const canvasX = (point.x - xMin) * xScale;
        const canvasY = height - (point.y - yMin) * yScale;
        
        // Рисуем кружок
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Рисуем контур
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Отображаем координаты
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`, canvasX + 10, canvasY - 10);
        ctx.fillStyle = '#ff4757';
    });
    
    // Отображаем количество точек пересечения
    if (intersections.length > 0) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Точек пересечения: ${intersections.length}`, 10, 20);
    }
}

// Метод бисекции для уточнения точки пересечения
function findIntersectionPoint(func1, func2, x1, x2, yMin, yMax) {
    let left = x1;
    let right = x2;
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
        const mid = (left + right) / 2;
        
        try {
            const expr1Left = func1.replace(/x/g, `(${left})`);
            const expr2Left = func2.replace(/x/g, `(${left})`);
            const expr1Right = func1.replace(/x/g, `(${right})`);
            const expr2Right = func2.replace(/x/g, `(${right})`);
            const expr1Mid = func1.replace(/x/g, `(${mid})`);
            const expr2Mid = func2.replace(/x/g, `(${mid})`);
            
            const y1Left = math.evaluate(expr1Left);
            const y2Left = math.evaluate(expr2Left);
            const y1Right = math.evaluate(expr1Right);
            const y2Right = math.evaluate(expr2Right);
            const y1Mid = math.evaluate(expr1Mid);
            const y2Mid = math.evaluate(expr2Mid);
            
            if (!isFinite(y1Left) || !isFinite(y2Left) || !isFinite(y1Right) || !isFinite(y2Right) || !isFinite(y1Mid) || !isFinite(y2Mid)) {
                return null;
            }
            
            const diffLeft = y1Left - y2Left;
            const diffRight = y1Right - y2Right;
            const diffMid = y1Mid - y2Mid;
            
            if (Math.abs(diffMid) < tolerance) {
                const y = (y1Mid + y2Mid) / 2;
                if (y >= yMin && y <= yMax) {
                    return { x: mid, y: y };
                }
                return null;
            }
            
            if (diffLeft * diffMid < 0) {
                right = mid;
            } else if (diffRight * diffMid < 0) {
                left = mid;
            } else {
                break;
            }
        } catch (error) {
            return null;
        }
    }
    
    const mid = (left + right) / 2;
    try {
        const expr1Mid = func1.replace(/x/g, `(${mid})`);
        const expr2Mid = func2.replace(/x/g, `(${mid})`);
        const y1Mid = math.evaluate(expr1Mid);
        const y2Mid = math.evaluate(expr2Mid);
        
        if (isFinite(y1Mid) && isFinite(y2Mid)) {
            const y = (y1Mid + y2Mid) / 2;
            if (y >= yMin && y <= yMax) {
                return { x: mid, y: y };
            }
        }
    } catch (error) {
        // ignore
    }
    
    return null;
}

// Функции для матриц
function getMatrixFromInput(inputId) {
    const input = document.getElementById(inputId).value.trim();
    if (!input) return null;
    
    try {
        // math.evaluate может напрямую обрабатывать строки матриц.
        // Предыдущая логика преобразования была некорректной и вызывала ошибки.
        const result = math.evaluate(input);
        return result;
    } catch (error) {
        console.error('Ошибка парсинга матрицы:', error);
        throw new Error('Неверный формат матрицы. Используйте формат: [[1,2],[3,4]] или [(1,2),(3,4)]');
    }
}

function displayMatrixResult(result, title = 'Результат:') {
    const resultDiv = document.getElementById('matrixResult');
    try {
        if (Array.isArray(result)) {
            if (Array.isArray(result[0])) {
                // Матрица
                resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${math.format(result, { precision: 20 })}</pre>`;
            } else {
                // Вектор
                resultDiv.innerHTML = `<strong>${title}</strong><br><pre>[${result.map(x => math.format(x, { precision: 20 })).join(', ')}]</pre>`;
            }
        } else {
            // Скаляр
            resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${math.format(result, { precision: 20 })}</pre>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${result}</pre>`;
    }
}

function multiplyMatrices() {
    try {
        const matrixA = getMatrixFromInput('matrixA');
        const matrixB = getMatrixFromInput('matrixB');
        
        if (!matrixA || !matrixB) {
            throw new Error('Введите обе матрицы');
        }
        
        const result = math.multiply(matrixA, matrixB);
        displayMatrixResult(result, 'A × B =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function addMatrices() {
    try {
        const matrixA = getMatrixFromInput('matrixA');
        const matrixB = getMatrixFromInput('matrixB');
        
        if (!matrixA || !matrixB) {
            throw new Error('Введите обе матрицы');
        }
        
        const result = math.add(matrixA, matrixB);
        displayMatrixResult(result, 'A + B =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function subtractMatrices() {
    try {
        const matrixA = getMatrixFromInput('matrixA');
        const matrixB = getMatrixFromInput('matrixB');
        
        if (!matrixA || !matrixB) {
            throw new Error('Введите обе матрицы');
        }
        
        const result = math.subtract(matrixA, matrixB);
        displayMatrixResult(result, 'A - B =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function determinantA() {
    try {
        const matrixA = getMatrixFromInput('matrixA');
        
        if (!matrixA) {
            throw new Error('Введите матрицу A');
        }
        
        const result = math.det(matrixA);
        displayMatrixResult(result, 'det(A) =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function determinantB() {
    try {
        const matrixB = getMatrixFromInput('matrixB');
        
        if (!matrixB) {
            throw new Error('Введите матрицу B');
        }
        
        const result = math.det(matrixB);
        displayMatrixResult(result, 'det(B) =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function inverseA() {
    try {
        const matrixA = getMatrixFromInput('matrixA');
        
        if (!matrixA) {
            throw new Error('Введите матрицу A');
        }
        
        const result = math.inv(matrixA);
        displayMatrixResult(result, 'A⁻¹ =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function inverseB() {
    try {
        const matrixB = getMatrixFromInput('matrixB');
        
        if (!matrixB) {
            throw new Error('Введите матрицу B');
        }
        
        const result = math.inv(matrixB);
        displayMatrixResult(result, 'B⁻¹ =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function transposeA() {
    try {
        const matrixA = getMatrixFromInput('matrixA');
        
        if (!matrixA) {
            throw new Error('Введите матрицу A');
        }
        
        const result = math.transpose(matrixA);
        displayMatrixResult(result, 'Aᵀ =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function transposeB() {
    try {
        const matrixB = getMatrixFromInput('matrixB');
        
        if (!matrixB) {
            throw new Error('Введите матрицу B');
        }
        
        const result = math.transpose(matrixB);
        displayMatrixResult(result, 'Bᵀ =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

// Функции для комплексных чисел
function getComplexNumber(realId, imagId) {
    const real = parseFloat(document.getElementById(realId).value) || 0;
    const imag = parseFloat(document.getElementById(imagId).value) || 0;
    return math.complex(real, imag);
}

function displayComplexResult(result, title = 'Результат:') {
    const resultDiv = document.getElementById('complexResult');
    try {
        if (typeof result === 'object' && result.re !== undefined) {
            // Комплексное число
            const formatted = math.format(result, { precision: 20 });
            resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${formatted}</pre>`;
        } else {
            // Вещественное число
            resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${math.format(result, { precision: 20 })}</pre>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${result}</pre>`;
    }
}

function addComplex() {
    try {
        const z1 = getComplexNumber('real1', 'imag1');
        const z2 = getComplexNumber('real2', 'imag2');
        const result = math.add(z1, z2);
        displayComplexResult(result, 'z₁ + z₂ =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function subtractComplex() {
    try {
        const z1 = getComplexNumber('real1', 'imag1');
        const z2 = getComplexNumber('real2', 'imag2');
        const result = math.subtract(z1, z2);
        displayComplexResult(result, 'z₁ - z₂ =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function multiplyComplex() {
    try {
        const z1 = getComplexNumber('real1', 'imag1');
        const z2 = getComplexNumber('real2', 'imag2');
        const result = math.multiply(z1, z2);
        displayComplexResult(result, 'z₁ × z₂ =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function divideComplex() {
    try {
        const z1 = getComplexNumber('real1', 'imag1');
        const z2 = getComplexNumber('real2', 'imag2');
        const result = math.divide(z1, z2);
        displayComplexResult(result, 'z₁ ÷ z₂ =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function modulusComplex1() {
    try {
        const z1 = getComplexNumber('real1', 'imag1');
        const result = math.abs(z1);
        displayComplexResult(result, '|z₁| =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function modulusComplex2() {
    try {
        const z2 = getComplexNumber('real2', 'imag2');
        const result = math.abs(z2);
        displayComplexResult(result, '|z₂| =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function conjugateComplex1() {
    try {
        const z1 = getComplexNumber('real1', 'imag1');
        const result = math.conj(z1);
        displayComplexResult(result, 'z₁̄ =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function conjugateComplex2() {
    try {
        const z2 = getComplexNumber('real2', 'imag2');
        const result = math.conj(z2);
        displayComplexResult(result, 'z₂̄ =');
    } catch (error) {
        document.getElementById('complexResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

// Функции для исчислений
function differentiate() {
    try {
        const func = document.getElementById('functionCalculus').value;
        if (!func) {
            throw new Error('Введите функцию');
        }
        
        // Используем math.js для символьного дифференцирования
        const node = math.parse(func);
        const derivative = math.derivative(node, 'x');
        const result = derivative.toString();
        
        document.getElementById('calculusResult').innerHTML = 
            `<strong>Производная f'(x) =</strong><br><pre>${result}</pre>`;
    } catch (error) {
        document.getElementById('calculusResult').innerHTML = 
            `<strong>Ошибка:</strong><br>Невозможно найти производную. Проверьте формат функции.`;
    }
}

function evaluateDerivative() {
    try {
        const func = document.getElementById('functionCalculus').value;
        const point = parseFloat(document.getElementById('pointCalculus').value);
        
        if (!func) {
            throw new Error('Введите функцию');
        }
        if (isNaN(point)) {
            throw new Error('Введите точку для вычисления');
        }
        
        // Находим производную
        const node = math.parse(func);
        const derivative = math.derivative(node, 'x');
        const result = derivative.evaluate({ x: point });
        
        document.getElementById('calculusResult').innerHTML = 
            `<strong>f'(${point}) =</strong><br><pre>${math.format(result, { precision: 6 })}</pre>`;
    } catch (error) {
        document.getElementById('calculusResult').innerHTML = 
            `<strong>Ошибка:</strong><br>Невозможно вычислить производную в точке.`;
    }
}

function integrate() {
    try {
        const func = document.getElementById('functionCalculus').value;
        if (!func) {
            throw new Error('Введите функцию');
        }
        
        // Для символьного интегрирования используем упрощенный подход
        // math.js не имеет встроенной функции интегрирования, поэтому покажем сообщение
        document.getElementById('calculusResult').innerHTML = 
            `<strong>Неопределенный интеграл ∫f(x)dx:</strong><br><pre>Символьное интегрирование не поддерживается в этой версии.<br>Используйте численное интегрирование для определенных интегралов.</pre>`;
    } catch (error) {
        document.getElementById('calculusResult').innerHTML = 
            `<strong>Ошибка:</strong><br>Невозможно найти интеграл.`;
    }
}

function definiteIntegral() {
    try {
        const func = document.getElementById('functionCalculus').value;
        const lower = parseFloat(document.getElementById('integralLower').value);
        const upper = parseFloat(document.getElementById('integralUpper').value);
        
        if (!func) {
            throw new Error('Введите функцию');
        }
        if (isNaN(lower) || isNaN(upper)) {
            throw new Error('Введите пределы интегрирования');
        }
        
        // Численное интегрирование методом трапеций
        const result = math.integrate(func, 'x', lower, upper);
        
        document.getElementById('calculusResult').innerHTML = 
            `<strong>∫[${lower},${upper}]f(x)dx =</strong><br><pre>${math.format(result, { precision: 6 })}</pre>`;
    } catch (error) {
        // Альтернативный метод численного интегрирования
        try {
            const func = document.getElementById('functionCalculus').value;
            const lower = parseFloat(document.getElementById('integralLower').value);
            const upper = parseFloat(document.getElementById('integralUpper').value);
            
            // Метод трапеций
            const n = 1000; // количество интервалов
            const h = (upper - lower) / n;
            let sum = 0;
            
            for (let i = 0; i <= n; i++) {
                const x = lower + i * h;
                const expr = func.replace(/x/g, `(${x})`);
                const y = math.evaluate(expr);
                if (i === 0 || i === n) {
                    sum += y;
                } else {
                    sum += 2 * y;
                }
            }
            
            const result = (h / 2) * sum;
            document.getElementById('calculusResult').innerHTML = 
                `<strong>∫[${lower},${upper}]f(x)dx =</strong><br><pre>${math.format(result, { precision: 6 })}</pre>`;
        } catch (innerError) {
            document.getElementById('calculusResult').innerHTML = 
                `<strong>Ошибка:</strong><br>Невозможно вычислить определенный интеграл.`;
        }
    }
}

// Дополнительные утилиты
function formatMatrix(matrix) {
    if (!Array.isArray(matrix)) return matrix.toString();
    
    if (Array.isArray(matrix[0])) {
        // Двумерная матрица
        return matrix.map(row => 
            '[' + row.map(cell => 
                typeof cell === 'number' ? cell.toFixed(4) : cell.toString()
            ).join(', ') + ']'
        ).join('\n');
    } else {
        // Одномерный массив (вектор)
        return '[' + matrix.map(cell => 
            typeof cell === 'number' ? cell.toFixed(4) : cell.toString()
        ).join(', ') + ']';
    }
}

// Обработчики для canvas (масштабирование мышью)
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('graphCanvas');
    if (canvas) {
        canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            if (e.deltaY < 0) {
                zoomIn();
            } else {
                zoomOut();
            }
        });
    }
});
