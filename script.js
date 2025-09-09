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
    initializeMatrixGrids();
    initializeUnitConverter();
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

            // При переключении на вкладку 3D-графиков, строим график
            if (tabName === '3d-graphs') {
                // Небольшая задержка, чтобы убедиться, что контейнер видим
                setTimeout(plot3dFunction, 50);
            }
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
function initializeMatrixGrids() {
    // Initial grid creation
    createMatrixGrid('matrixA-grid', 2, 2, [[1, 2], [3, 4]]);
    createMatrixGrid('matrixB-grid', 2, 1, [[5], [6]]); // Default to a vector

    // Event listeners for dimension changes
    document.getElementById('matrixARows').addEventListener('change', () => updateMatrixGrid('A'));
    document.getElementById('matrixACols').addEventListener('change', () => updateMatrixGrid('A'));
    document.getElementById('matrixBRows').addEventListener('change', () => updateMatrixGrid('B'));
    document.getElementById('matrixBCols').addEventListener('change', () => updateMatrixGrid('B'));
}

function updateMatrixGrid(matrixName) {
    const rows = document.getElementById(`matrix${matrixName}Rows`).value;
    const cols = document.getElementById(`matrix${matrixName}Cols`).value;
    createMatrixGrid(`matrix${matrixName}-grid`, rows, cols);
}

function createMatrixGrid(containerId, rows, cols, defaultValues = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.value = (defaultValues[i] && defaultValues[i][j] !== undefined) ? defaultValues[i][j] : 0;
            container.appendChild(input);
        }
    }
}

function getMatrixFromGrid(matrixName) {
    const rows = parseInt(document.getElementById(`matrix${matrixName}Rows`).value);
    const cols = parseInt(document.getElementById(`matrix${matrixName}Cols`).value);
    const grid = document.getElementById(`matrix${matrixName}-grid`);
    const inputs = grid.getElementsByTagName('input');
    
    if (inputs.length !== rows * cols) {
        throw new Error(`Матрица ${matrixName} неправильно инициализирована.`);
    }

    const matrix = [];
    let inputIndex = 0;
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const value = parseFloat(inputs[inputIndex].value);
            if (isNaN(value)) {
                throw new Error(`Неверное число в матрице ${matrixName} в строке ${i+1}, столбце ${j+1}`);
            }
            row.push(value);
            inputIndex++;
        }
        matrix.push(row);
    }
    return matrix;
}

function displayMatrixResult(result, title = 'Результат:') {
    const resultDiv = document.getElementById('matrixResult');
    let content = `<strong>${title}</strong><br>`;

    try {
        if (result.values && result.vectors) {
            // Eigenvalues/vectors result
            content += 'Собственные значения (Eigenvalues):';
            content += `<pre>${math.format(result.values, { precision: 5 })}</pre>`;
            content += 'Собственные векторы (Eigenvectors):';
            content += `<pre>${math.format(result.vectors, { precision: 5 })}</pre>`;
        } else if (Array.isArray(result) || result.isMatrix) {
            // Standard matrix or vector
            content += `<pre>${math.format(result, { precision: 5 })}</pre>`;
        } else {
            // Scalar
            content += `<pre>${math.format(result, { precision: 5 })}</pre>`;
        }
        resultDiv.innerHTML = content;
    } catch (error) {
        resultDiv.innerHTML = `<strong>${title}</strong><br><pre>${result}</pre>`;
    }
}

function multiplyMatrices() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const matrixB = getMatrixFromGrid('B');
        const result = math.multiply(matrixA, matrixB);
        displayMatrixResult(result, 'A × B =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function addMatrices() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const matrixB = getMatrixFromGrid('B');
        const result = math.add(matrixA, matrixB);
        displayMatrixResult(result, 'A + B =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function subtractMatrices() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const matrixB = getMatrixFromGrid('B');
        const result = math.subtract(matrixA, matrixB);
        displayMatrixResult(result, 'A - B =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function determinantA() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const result = math.det(matrixA);
        displayMatrixResult(result, 'det(A) =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function inverseA() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const result = math.inv(matrixA);
        displayMatrixResult(result, 'A⁻¹ =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function transposeA() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const result = math.transpose(matrixA);
        displayMatrixResult(result, 'Aᵀ =');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function eigenA() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const result = math.eigs(matrixA);
        displayMatrixResult(result, 'Собственные значения/векторы матрицы A');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

function solveLinearSystem() {
    try {
        const matrixA = getMatrixFromGrid('A');
        const matrixB = getMatrixFromGrid('B');
        
        // Extract the first column of B as the vector b
        const b = matrixB.map(row => row[0]);

        const result = math.lusolve(matrixA, b);
        displayMatrixResult(result, 'Решение системы Ax=b (x):');
    } catch (error) {
        document.getElementById('matrixResult').innerHTML = `<strong>Ошибка:</strong><br>${error.message}`;
    }
}

// Функции для 3D графиков
function plot3dFunction() {
    try {
        const funcStr = document.getElementById('function3dInput').value;
        if (!funcStr) {
            return; // Не строим график, если поле пустое
        }

        const xMin = parseFloat(document.getElementById('x3dMin').value);
        const xMax = parseFloat(document.getElementById('x3dMax').value);
        const yMin = parseFloat(document.getElementById('y3dMin').value);
        const yMax = parseFloat(document.getElementById('y3dMax').value);

        const resolution = 40; // Уменьшаем разрешение для скорости
        const xValues = math.range(xMin, xMax, (xMax - xMin) / resolution).toArray();
        const yValues = math.range(yMin, yMax, (yMax - yMin) / resolution).toArray();

        const zValues = [];
        const node = math.parse(funcStr);
        const code = node.compile();

        for (let i = 0; i < yValues.length; i++) {
            const zRow = [];
            for (let j = 0; j < xValues.length; j++) {
                const z = code.evaluate({ x: xValues[j], y: yValues[i] });
                zRow.push(z);
            }
            zValues.push(zRow);
        }

        const data = [{
            z: zValues,
            x: xValues,
            y: yValues,
            type: 'surface',
            contours: {
                z: {
                  show:true,
                  usecolormap: true,
                  highlightcolor:"#42f462",
                  project:{z: true}
                }
              }
        }];

        const layout = {
            title: `z = ${funcStr}`,
            autosize: true,
            margin: { l: 40, r: 40, b: 40, t: 60 }
        };

        Plotly.newPlot('graph3dCanvas', data, layout, {responsive: true});

    } catch (error) {
        console.error('Ошибка построения 3D графика:', error);
        alert('Не удалось построить 3D график. Проверьте правильность функции.');
    }
}

// Функции для конвертера
const conversionRates = {
    length: {
        meter: 1,
        kilometer: 1000,
        centimeter: 0.01,
        millimeter: 0.001,
        mile: 1609.34,
        yard: 0.9144,
        foot: 0.3048,
        inch: 0.0254
    },
    mass: {
        gram: 1,
        kilogram: 1000,
        milligram: 0.001,
        pound: 453.592,
        ounce: 28.3495
    },
    area: {
        'square meter': 1,
        'square kilometer': 1000000,
        hectare: 10000,
        'square mile': 2589988.11,
        acre: 4046.86
    }
};

const unitTranslations = {
    length: 'Длина',
    mass: 'Масса',
    area: 'Площадь',
    meter: 'Метр',
    kilometer: 'Километр',
    centimeter: 'Сантиметр',
    millimeter: 'Миллиметр',
    mile: 'Миля',
    yard: 'Ярд',
    foot: 'Фут',
    inch: 'Дюйм',
    gram: 'Грамм',
    kilogram: 'Килограмм',
    milligram: 'Миллиграмм',
    pound: 'Фунт',
    ounce: 'Унция',
    'square meter': 'Кв. метр',
    'square kilometer': 'Кв. километр',
    hectare: 'Гектар',
    'square mile': 'Кв. миля',
    acre: 'Акp'
};

function initializeUnitConverter() {
    const categorySelect = document.getElementById('unitCategory');
    const fromUnitSelect = document.getElementById('fromUnit');
    const toUnitSelect = document.getElementById('toUnit');
    const fromValueInput = document.getElementById('fromValue');

    // Populate category dropdown
    for (const category in conversionRates) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = unitTranslations[category] || category;
        categorySelect.appendChild(option);
    }

    // Event listeners
    categorySelect.addEventListener('change', updateUnitDropdowns);
    fromUnitSelect.addEventListener('change', convertUnits);
    toUnitSelect.addEventListener('change', convertUnits);
    fromValueInput.addEventListener('input', convertUnits);

    // Initial setup
    updateUnitDropdowns();
}

function updateUnitDropdowns() {
    const category = document.getElementById('unitCategory').value;
    const fromUnitSelect = document.getElementById('fromUnit');
    const toUnitSelect = document.getElementById('toUnit');
    
    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';

    const units = conversionRates[category];
    for (const unit in units) {
        const option1 = document.createElement('option');
        option1.value = unit;
        option1.textContent = unitTranslations[unit] || unit;
        fromUnitSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = unit;
        option2.textContent = unitTranslations[unit] || unit;
        toUnitSelect.appendChild(option2);
    }

    // Set default different units
    fromUnitSelect.selectedIndex = 0;
    toUnitSelect.selectedIndex = 1;

    convertUnits();
}

function convertUnits() {
    const category = document.getElementById('unitCategory').value;
    const fromValue = parseFloat(document.getElementById('fromValue').value);
    const fromUnit = document.getElementById('fromUnit').value;
    const toUnit = document.getElementById('toUnit').value;
    const toValueDiv = document.getElementById('toValue');

    if (isNaN(fromValue)) {
        toValueDiv.textContent = '';
        return;
    }

    const fromFactor = conversionRates[category][fromUnit];
    const toFactor = conversionRates[category][toUnit];

    const result = fromValue * fromFactor / toFactor;

    toValueDiv.textContent = result.toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 8 });
}

// Функции для теории чисел
function calculateGcd() {
    try {
        const a = math.bignumber(document.getElementById('gcdLcmA').value);
        const b = math.bignumber(document.getElementById('gcdLcmB').value);
        const result = math.gcd(a, b);
        document.getElementById('gcdLcmResult').innerHTML = `<pre>${result.toString()}</pre>`;
    } catch (error) {
        document.getElementById('gcdLcmResult').innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateLcm() {
    try {
        const a = math.bignumber(document.getElementById('gcdLcmA').value);
        const b = math.bignumber(document.getElementById('gcdLcmB').value);
        const result = math.lcm(a, b);
        document.getElementById('gcdLcmResult').innerHTML = `<pre>${result.toString()}</pre>`;
    } catch (error) {
        document.getElementById('gcdLcmResult').innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateModulo() {
    try {
        const a = math.bignumber(document.getElementById('modInputA').value);
        const b = math.bignumber(document.getElementById('modInputB').value);
        const result = math.mod(a, b);
        document.getElementById('modResult').innerHTML = `<pre>${result.toString()}</pre>`;
    } catch (error) {
        document.getElementById('modResult').innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculatePrimeFactorization() {
    const resultDiv = document.getElementById('primeFactorResult');
    try {
        const n = parseInt(document.getElementById('primeFactorInput').value);
        if (isNaN(n) || n < 2) {
            throw new Error('Введите целое число больше 1');
        }

        const factors = primeFactorize(n);
        const formattedResult = formatFactors(factors);
        resultDiv.innerHTML = `<pre>${formattedResult}</pre>`;

    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function primeFactorize(n) {
    const factors = {};
    let d = 2;
    let num = n;
    while (d * d <= num) {
        while (num % d === 0) {
            factors[d] = (factors[d] || 0) + 1;
            num /= d;
        }
        d++;
    }
    if (num > 1) {
        factors[num] = (factors[num] || 0) + 1;
    }
    return factors;
}

function formatFactors(factors) {
    return Object.entries(factors)
        .map(([base, exp]) => exp > 1 ? `${base}<sup>${exp}</sup>` : `${base}`)
        .join(' × ');
}

// Функции для статистики
function getDataSet(inputId) {
    const rawText = document.getElementById(inputId).value;
    return rawText.split(',').map(item => parseFloat(item.trim())).filter(val => !isNaN(val));
}

function calculateMean() {
    const data = getDataSet('dataSetInput');
    const resultDiv = document.getElementById('descStatsResult');
    if (data.length === 0) {
        resultDiv.innerHTML = '<pre>Нет данных</pre>';
        return;
    }
    try {
        const result = math.mean(data);
        resultDiv.innerHTML = `<pre>Среднее: ${math.format(result, {precision: 5})}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateMedian() {
    const data = getDataSet('dataSetInput');
    const resultDiv = document.getElementById('descStatsResult');
    if (data.length === 0) {
        resultDiv.innerHTML = '<pre>Нет данных</pre>';
        return;
    }
    try {
        const result = math.median(data);
        resultDiv.innerHTML = `<pre>Медиана: ${math.format(result, {precision: 5})}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateMode() {
    const data = getDataSet('dataSetInput');
    const resultDiv = document.getElementById('descStatsResult');
    if (data.length === 0) {
        resultDiv.innerHTML = '<pre>Нет данных</pre>';
        return;
    }
    try {
        const result = math.mode(data);
        resultDiv.innerHTML = `<pre>Мода: ${math.format(result, {precision: 5})}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateStdDev() {
    const data = getDataSet('dataSetInput');
    const resultDiv = document.getElementById('descStatsResult');
    if (data.length < 2) {
        resultDiv.innerHTML = '<pre>Нужно мин. 2 значения</pre>';
        return;
    }
    try {
        const result = math.std(data);
        resultDiv.innerHTML = `<pre>Ст. отклонение: ${math.format(result, {precision: 5})}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateVariance() {
    const data = getDataSet('dataSetInput');
    const resultDiv = document.getElementById('descStatsResult');
    if (data.length < 2) {
        resultDiv.innerHTML = '<pre>Нужно мин. 2 значения</pre>';
        return;
    }
    try {
        const result = math.variance(data);
        resultDiv.innerHTML = `<pre>Дисперсия: ${math.format(result, {precision: 5})}</pre>`;
    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
    }
}

function calculateLinearRegression() {
    const xData = getDataSet('regressionX');
    const yData = getDataSet('regressionY');
    const resultDiv = document.getElementById('regressionResult');

    if (xData.length !== yData.length || xData.length === 0) {
        resultDiv.innerHTML = '<pre>Ошибка: Наборы данных X и Y должны иметь одинаковую ненулевую длину.</pre>';
        return;
    }

    try {
        const n = xData.length;
        const sumX = math.sum(xData);
        const sumY = math.sum(yData);
        const sumXY = math.sum(math.dotMultiply(xData, yData));
        const sumX2 = math.sum(math.dotMultiply(xData, xData));
        const sumY2 = math.sum(math.dotMultiply(yData, yData));

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const c = (sumY - m * sumX) / n;

        const r2_num = (n * sumXY - sumX * sumY);
        const r2_den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        const r2 = Math.pow(r2_num / r2_den, 2);

        let resultText = `<b>Уравнение:</b> y = ${m.toFixed(4)}x + ${c.toFixed(4)}<br>`;
        resultText += `<b>R-квадрат:</b> ${r2.toFixed(4)}`;

        resultDiv.innerHTML = `<pre>${resultText}</pre>`;

    } catch (error) {
        resultDiv.innerHTML = `<pre>Ошибка: ${error.message}</pre>`;
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


//Решение уравнений:
// --- Простая реализация комплексных чисел ---
class C {
  constructor(re=0, im=0){ this.re = re; this.im = im; }
  add(b){ return new C(this.re + b.re, this.im + b.im); }
  sub(b){ return new C(this.re - b.re, this.im - b.im); }
  mul(b){ return new C(this.re*b.re - this.im*b.im, this.re*b.im + this.im*b.re); }
  div(b){
    const den = b.re*b.re + b.im*b.im;
    return new C((this.re*b.re + this.im*b.im)/den, (this.im*b.re - this.re*b.im)/den);
  }
  abs(){ return Math.hypot(this.re, this.im); }
  neg(){ return new C(-this.re, -this.im); }
  scale(s){ return new C(this.re * s, this.im * s); }
  equals(b, eps=1e-12){ return Math.abs(this.re-b.re) < eps && Math.abs(this.im-b.im) < eps; }
  toString(prec=6){
    const r = Number(this.re.toFixed(prec));
    const i = Number(this.im.toFixed(prec));
    if (Math.abs(i) < 1e-12) return `${r}`;
    if (Math.abs(r) < 1e-12) return `${i}i`;
    const sign = i >= 0 ? "+" : "-";
    return `${r} ${sign} ${Math.abs(i)}i`;
  }
}

// Убираем ведущие нули коэффициентов
function trimLeadingZeros(arr){
  let i=0;
  while(i+1 < arr.length && Math.abs(arr[i]) < 1e-14) i++;
  return arr.slice(i);
}

// Оценка многочлена p в z; p — массив комплексных коэффициентов: [a0, a1, ..., an] (старшая степень первая)
function polyEvalComplex(p, z){
  // Horner
  let res = new C(0,0);
  for (let coeff of p){
    res = res.mul(z).add(coeff);
  }
  return res;
}

// Вспомог: преобразовать массив действительных коэффициентов в комплексные объекты
function toComplexArray(arr){
  return arr.map(v => new C(v, 0));
}

// Решение для n=1 и n=2 явно
function solveLinear(a,b){ // ax + b = 0 ; a != 0
  return [ new C(-b/a, 0) ];
}
function solveQuadratic(a,b,c){
  // ax^2 + bx + c = 0
  if (Math.abs(a) < 1e-16){
    return solveLinear(b,c);
  }
  const D = b*b - 4*a*c;
  if (D >= 0){
    const sqrtD = Math.sqrt(D);
    return [ new C((-b + sqrtD)/(2*a), 0), new C((-b - sqrtD)/(2*a), 0) ];
  } else {
    const sqrtD = Math.sqrt(-D);
    return [ new C(-b/(2*a), sqrtD/(2*a)), new C(-b/(2*a), -sqrtD/(2*a)) ];
  }
}

// Durand-Kerner (Weierstrass) для комплексных корней
function durandKernerRealCoeffs(realCoeffs, opts = {}){
  // realCoeffs: [a0,a1,...,an] — действительные, старшая степень первая
  const tol = opts.tol ?? 1e-12;
  const maxIter = opts.maxIter ?? 2000;
  let coeffs = trimLeadingZeros(realCoeffs.slice());
  const deg = coeffs.length - 1;
  if (deg <= 0) return [];
  if (deg === 1) return solveLinear(coeffs[0], coeffs[1]);
  if (deg === 2) return solveQuadratic(coeffs[0], coeffs[1], coeffs[2]);

  // Перевод коэффициентов в комплексные
  const p = toComplexArray(coeffs);

  // Оценка радиуса для начальных приближений: 1 + max(|a_i / a0|)
  const a0 = Math.abs(coeffs[0]);
  let R = 1;
  if (a0 > 0){
    let m = 0;
    for (let i=1;i<coeffs.length;i++) m = Math.max(m, Math.abs(coeffs[i]) / a0);
    R = 1 + m;
  }

  // начальные приближения: равномерно распределённые точки на круге радиуса R
  let roots = [];
  for (let k=0;k<deg;k++){
    const theta = 2*Math.PI*k/deg;
    roots.push(new C(R*Math.cos(theta), R*Math.sin(theta)));
  }

  // Итерации
  for (let iter=0; iter<maxIter; iter++){
    let maxChange = 0;
    const newRoots = [];
    for (let i=0;i<deg;i++){
      const xi = roots[i];
      const fx = polyEvalComplex(p, xi);
      // произведение (xi - xj) j != i
      let denom = new C(1,0);
      for (let j=0;j<deg;j++){
        if (j===i) continue;
        const diff = xi.sub(roots[j]);
        // если дифф очень мал — поправка (помогает от деления на ноль)
        if (diff.abs() < 1e-18){
          denom = denom.mul(new C(1e-18,0));
        } else {
          denom = denom.mul(diff);
        }
      }
      const delta = fx.div(denom);
      const xiNew = xi.sub(delta);
      newRoots.push(xiNew);
      maxChange = Math.max(maxChange, delta.abs());
    }
    roots = newRoots;
    if (maxChange < tol) break;
  }
  return roots;
}

// UI
const out = document.getElementById('out');
const solveBtn = document.getElementById('solve');
const coeffsInput = document.getElementById('coeffs');
const cv = document.getElementById('cv');
const showPlot = document.getElementById('showPlot');

function print(msg){
  out.textContent = msg;
}

function parseCoeffs(text){
  // разделяем по запятым/пробелам; допускаем точки как десятичные разделители
  const parts = text.split(/[\s,;]+/).filter(s => s.trim().length>0);
  const arr = parts.map(s => {
    const v = Number(s.replace(',', '.'));
    if (Number.isFinite(v)) return v;
    else throw new Error('Неправильный формат коэффициента: ' + s);
  });
  return arr;
}

function drawRoots(roots){
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,cv.width, cv.height);
  // Найти диапазон
  const pad = 0.2;
  let maxC = 1e-6;
  for (const r of roots) maxC = Math.max(maxC, Math.abs(r.re), Math.abs(r.im));
  const limit = maxC * (1 + pad);
  const W = cv.width, H = cv.height;
  // оси
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1;
  // x axis
  const x0 = W/2;
  const y0 = H/2;
  ctx.beginPath();
  ctx.moveTo(0, y0);
  ctx.lineTo(W, y0);
  ctx.moveTo(x0, 0);
  ctx.lineTo(x0, H);
  ctx.stroke();

  // сетка делений
  ctx.fillStyle = '#000';
  ctx.font = '12px sans-serif';

  // plot roots
  for (let r of roots){
    const sx = x0 + (r.re / limit) * (W/2);
    const sy = y0 - (r.im / limit) * (H/2);
    // точка
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, 2*Math.PI);
    ctx.fillStyle = '#2b7';
    ctx.fill();
    ctx.strokeStyle = '#063';
    ctx.stroke();
    // подпись
    ctx.fillStyle = '#000';
    ctx.fillText(r.toString(6), sx + 8, sy - 8);
  }

  // подписи масштаба
  ctx.fillStyle = '#333';
  ctx.fillText(( -limit ).toFixed(3), 4, y0 - 4);
  ctx.fillText(( +limit ).toFixed(3), W - 48, y0 - 4);
  ctx.fillText(( +limit ).toFixed(3), x0 + 4, 12);
  ctx.fillText(( -limit ).toFixed(3), x0 + 4, H - 6);
}

solveBtn.addEventListener('click', ()=>{
  try {
    const arr = parseCoeffs(coeffsInput.value.trim());
    if (arr.length === 0) { print('Введите коэффициенты.'); return; }
    // удаляем ведущие нули (если пользователь ввёл)
    const trimmed = trimLeadingZeros(arr);
    if (trimmed.length === 0){ print('Многочлен нулевой степени.'); return; }
    const deg = trimmed.length - 1;
    print('Степень: ' + deg + '\nВычисляю корни...');

    // Для степени 1 и 2 используем явные формулы, иначе Durand-Kerner
    let roots;
    if (deg === 0){
      print('Константа, корней нет.');
      return;
    } else if (deg === 1){
      roots = solveLinear(trimmed[0], trimmed[1]);
    } else if (deg === 2){
      roots = solveQuadratic(trimmed[0], trimmed[1], trimmed[2]);
    } else {
      roots = durandKernerRealCoeffs(trimmed, {tol:1e-12, maxIter:2000});
    }
    // Вывод
    let s = `Найдено корней: ${roots.length}\n\n`;
    roots.forEach((r,i)=>{
      s += `root ${i+1}: ${r.toString(10)}    |  abs=${r.abs().toFixed(10)}\n`;
    });
    print(s);

    if (showPlot.checked){
      drawRoots(roots);
    } else {
      const ctx = cv.getContext('2d');
      ctx.clearRect(0,0,cv.width,cv.height);
    }

  } catch (e){
    print('Ошибка: ' + e.message);
  }
});

// Пример по кнопке двойного клика — вставка примера
coeffsInput.addEventListener('dblclick', ()=>{
  coeffsInput.value = '1,0,-2,1'; // x^3 - 2x + 1
});