// script.js
/**
 * KIMPL1 - Вычисление замыкания системы функциональных зависимостей
 * Версия 8.2 (веб-порт)
 * 
 * Алгоритм основан на оригинальном PL/I коде (1986)
 * Правила: транзитивность и псевдотранзитивность
 */

// ============================================================
// Хранилище данных
// ============================================================
let appState = {
    currentFile: null,
    originalKubList: null,
    originalN: null,
    originalKc1: null,
    closureCubes: null,
    closureResult: null,
    resultSaved: true
};

// ============================================================
// АЛГОРИТМИЧЕСКАЯ ЧАСТЬ
// ============================================================

function krang(val, kubl, l, n, ib, ie) {
    let k0 = 0, k1 = 0, k2 = 0, k3 = 0;
    if (!val || val.length === 0) {
        return { val, kubl, k0, k1, k2, k3 };
    }
    let swapped = true;
    while (swapped) {
        swapped = false;
        for (let i = ib - 1; i < ie - 1; i++) {
            let cond = (l === 0 && val[i] < val[i + 1]) || (l === 1 && val[i] > val[i + 1]);
            if (cond) {
                [val[i], val[i + 1]] = [val[i + 1], val[i]];
                [kubl[i], kubl[i + 1]] = [kubl[i + 1], kubl[i]];
                swapped = true;
            }
        }
    }
    for (let i = ib - 1; i < ie; i++) {
        if (val[i] === 1) k1++;
        else if (val[i] === 2) k2++;
        else if (val[i] === 3) k3++;
        else if (val[i] === 0) k0++;
    }
    return { val, kubl, k0, k1, k2, k3 };
}

function tmToCube(tmStr, n) {
    const parts = tmStr.split('-');
    const determinantPart = parts[0];
    const functionPart = parts.length > 1 ? parts[1] : "";
    let determinants = [];
    if (determinantPart.includes('*')) {
        determinants = determinantPart.split('*').map(x => parseInt(x, 10));
    } else {
        determinants = determinantPart ? [parseInt(determinantPart, 10)] : [];
    }
    let functions = [];
    if (functionPart) {
        if (functionPart.includes('-')) {
            functions = functionPart.split('-').map(x => parseInt(x, 10));
        } else {
            functions = [parseInt(functionPart, 10)];
        }
    }
    let value = 0;
    for (let i = 0; i < n; i++) {
        const attrNum = i + 1;
        let digit;
        if (determinants.includes(attrNum)) {
            digit = 1;
        } else if (functions.includes(attrNum)) {
            digit = 2;
        } else {
            digit = 3;
        }
        value |= (digit << (i * 2));
    }
    return value;
}

function cubeToStr(cubeValue, n) {
    const parts = [];
    for (let i = 0; i < n; i++) {
        const digit = (cubeValue >> (i * 2)) & 3;
        if (digit === 1) parts.push("01");
        else if (digit === 2) parts.push("10");
        else if (digit === 3) parts.push("11");
        else parts.push("00");
    }
    return parts.join(".");
}

function cubeToTm(cubeValue, n) {
    const determinants = [];
    const functions = [];
    for (let i = 0; i < n; i++) {
        const digit = (cubeValue >> (i * 2)) & 3;
        if (digit === 1) determinants.push((i + 1).toString());
        else if (digit === 2) functions.push((i + 1).toString());
    }
    if (functions.length === 0) return "";
    return determinants.join("*") + "-" + functions.join("-");
}

function kimpl1(kubList, n, kc1) {
    console.log("kimpl1 started", { n, kc1, kubListLength: kubList.length });
    const g = n * 2;
    let kub = kubList.slice(0, kc1);
    let ic = kc1;
    let va = new Array(ic).fill(1);
    let k2 = 1;
    let k3 = 0;
    let ir = 0;
    let swi = 1;
    let swout = 1;
    let l = 0;
    let cz1 = [];
    let cz2 = [];
    let swz = 1;
    
    let iteration = 0;
    while (swout) {
        iteration++;
        console.log(`Iteration ${iteration}, ic=${ic}, ir=${ir}, k2=${k2}, k3=${k3}`);
        let changed = false;
        const ik1 = ic - 1;
        const ih1 = k3;
        
        for (let i1 = ih1; i1 < ik1; i1++) {
            const x = kub[i1];
            let ih2;
            if (swi || (!swi && (i1 + 1 > k2 + k3))) {
                ih2 = i1 + 1;
            } else {
                ih2 = k2 + k3;
            }
            
            for (let i2 = ih2; i2 < ic; i2++) {
                const y = kub[i2];
                let j = 0;
                let r = x & y;
                let p = 7;
                for (let iBit = 0; iBit < g; iBit += 2) {
                    if (((r >> iBit) & 3) === 0) {
                        j = iBit / 2;
                        p++;
                    }
                }
                
                if (p === 8 && j >= 0) {
                    r = r | (3 << (j * 2));
                    let swkub = 1;
                    
                    for (let i3 = 0; i3 < ic; i3++) {
                        const z = kub[i3];
                        const yTemp = r & z;
                        if (r === z || yTemp === r) {
                            swkub = 0;
                            break;
                        }
                    }
                    
                    if (swkub && ir > 0) {
                        for (let i3 = 0; i3 < ir; i3++) {
                            const z = swz ? cz1[i3] : cz2[i3];
                            const yTemp = r & z;
                            if (r === z || yTemp === r) {
                                swkub = 0;
                                break;
                            }
                        }
                    }
                    
                    if (swkub) {
                        ir++;
                        if (swz) {
                            cz1.push(r);
                        } else {
                            cz2.push(r);
                        }
                        changed = true;
                        console.log("  New cube added:", cubeToStr(r, n));
                    }
                }
            }
        }
        
        swi = 0;
        if (!changed) {
            swout = 0;
            console.log("No changes, exiting");
            break;
        }
        
        if (ir > 0) {
            let vs = new Array(ir).fill(1);
            for (let m1 = 0; m1 < ir - 1; m1++) {
                const x = swz ? cz1[m1] : cz2[m1];
                for (let m2 = m1 + 1; m2 < ir; m2++) {
                    const y = swz ? cz1[m2] : cz2[m2];
                    const r = x & y;
                    if (r === x) vs[m1] = 0;
                }
            }
            
            let ib = 1;
            let ie = ir;
            let k1_tmp = 0, k2_tmp = 0, k3_tmp = 0;
            if (swz) {
                const res = krang(vs, cz1, l, n, ib, ie);
                vs = res.val;
                cz1 = res.kubl;
                k1_tmp = res.k1;
                k2_tmp = res.k2;
                k3_tmp = res.k3;
            } else {
                const res = krang(vs, cz2, l, n, ib, ie);
                vs = res.val;
                cz2 = res.kubl;
                k1_tmp = res.k1;
                k2_tmp = res.k2;
                k3_tmp = res.k3;
            }
            
            ir = k1_tmp;      // количество активных новых кубов
            
            if (va.length !== ic) {
                va = new Array(ic).fill(0);
                for (let j = 0; j < kc1; j++) {
                    if (j < va.length) va[j] = 1;
                }
            }
            
            for (let i = 0; i < ic; i++) {
                const x = kub[i];
                let swk2 = 1;
                let swkub = 1;
                for (let i1 = 0; i1 < ir && swkub; i1++) {
                    const y = swz ? cz1[i1] : cz2[i1];
                    let p = 7;
                    const r = x & y;
                    for (let i2 = 0; i2 < g; i2 += 2) {
                        if (((r >> i2) & 3) === 0) p++;
                    }
                    if (p === 8) {
                        if (i < va.length) va[i] = 2;
                        swk2 = 0;
                        break;
                    } else if (p === 7 && r === x) {
                        if (i < va.length) va[i] = 0;
                        swkub = 0;
                        break;
                    }
                }
                if (swkub && swk2 && i < va.length) va[i] = 3;
            }
            
            let ib2 = 1;
            let ie2 = ic;
            const krangResult2 = krang(va, kub, l, n, ib2, ie2);
            va = krangResult2.val;
            kub = krangResult2.kubl;
            
            // Обновляем k2, k3 из второго вызова krang (сортировка VA и KUB)
            k2 = krangResult2.k2;
            k3 = krangResult2.k3;
            
            ic = k3 + k2 + ir;
            const newKub = kub.slice(0, k3 + k2).concat((swz ? cz1 : cz2).slice(0, ir));
            kub = newKub;
            
            cz1 = [];
            cz2 = [];
            swz = 1;
            ir = 0;
            // k2 и k3 сохраняются для следующей итерации? 
            // В PL/I они сбрасываются в конце блока
            k2 = 1;
            k3 = 0;
        }
    }
    
    console.log("kimpl1 finished, ic:", ic);
    return { kub, ic };
}

function removeFdscElements(xmlString) {
    return xmlString.replace(/<!--\s*FDS Closure\s*-->/gi, '');
}

async function parseXmlFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let xmlString = e.target.result;
                xmlString = removeFdscElements(xmlString);
                
                const tempParser = new DOMParser();
                const tempDoc = tempParser.parseFromString(xmlString, "text/xml");
                const fdscElements = tempDoc.querySelectorAll('fdsc');
                for (const elem of fdscElements) {
                    elem.remove();
                }
                const serializer = new XMLSerializer();
                xmlString = serializer.serializeToString(tempDoc);
                
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                const parserError = xmlDoc.querySelector("parsererror");
                if (parserError) {
                    reject(new Error("Ошибка парсинга XML: " + parserError.textContent));
                    return;
                }
                
                const fdsiElement = xmlDoc.querySelector('fdsi');
                if (!fdsiElement) {
                    reject(new Error("Не найден элемент <fdsi>"));
                    return;
                }
                
                const tmStrings = [];
                let maxAttr = 0;
                
                for (const elem of fdsiElement.children) {
                    if (elem.tagName && elem.tagName.startsWith('fd')) {
                        const tmStr = elem.textContent.trim();
                        if (!tmStr) continue;
                        tmStrings.push(tmStr);
                        const nums = tmStr.split(/[*\-]/).filter(x => x).map(x => parseInt(x, 10));
                        if (nums.length) {
                            maxAttr = Math.max(maxAttr, ...nums);
                        }
                    }
                }
                
                if (maxAttr === 0) {
                    reject(new Error("Не найдено ни одной ФЗ"));
                    return;
                }
                
                const n = maxAttr;
                const kubList = [];
                for (const tmStr of tmStrings) {
                    kubList.push(tmToCube(tmStr, n));
                }
                kubList.push(0);
                const kc1 = kubList.length - 1;
                
                resolve({ kubList, n, kc1 });
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Ошибка чтения файла"));
        reader.readAsText(file);
    });
}

function writeXmlResult(originalKubList, originalKc1, kubResult, ic, n) {
    const originalSet = new Set(originalKubList.slice(0, originalKc1));
    const orderedOriginal = [];
    for (let i = 0; i < originalKc1; i++) {
        const cube = originalKubList[i];
        if (originalSet.has(cube)) orderedOriginal.push(cube);
    }
    const newCubes = kubResult.filter(cube => !originalSet.has(cube));
    const orderedResult = orderedOriginal.concat(newCubes);
    
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
    lines.push('<fds>');
    lines.push('<fdsi>');
    
    for (let idx = 0; idx < originalKc1; idx++) {
        const cubeValue = originalKubList[idx];
        const tmStr = cubeToTm(cubeValue, n);
        const bStr = cubeToStr(cubeValue, n);
        lines.push(`    <fd${idx + 1}>${tmStr}</fd${idx + 1}>   <!-- ${bStr} -->`);
    }
    
    lines.push('</fdsi>');
    lines.push('<fdsc>');
    
    for (let idx = 0; idx < orderedResult.length; idx++) {
        const cubeValue = orderedResult[idx];
        const tmStr = cubeToTm(cubeValue, n);
        const bStr = cubeToStr(cubeValue, n);
        lines.push(`    <fd${idx + 1}>${tmStr}</fd${idx + 1}>   <!-- ${bStr} -->`);
    }
    
    lines.push('</fdsc>');
    lines.push('</fds>');
    
    return lines.join("\n");
}

function formatFdsList(cubes, n, startNumber = 1) {
    let html = '';
    for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];
        const tmStr = cubeToTm(cube, n);
        const bStr = cubeToStr(cube, n);
        html += `<div class="fd-item">
            <span class="fd-number">${startNumber + i}:</span>
            <span class="fd-tm">${tmStr}</span>
            <span class="fd-comment">&lt;!-- ${bStr} --&gt;</span>
        </div>`;
    }
    return html;
}

function updateUI() {
    const btnSave = document.getElementById('btnSave');
    const btnSaveAs = document.getElementById('btnSaveAs');
    const btnCalculate = document.getElementById('btnCalculate');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const statusBar = document.getElementById('statusBar');
    
    if (appState.originalKubList) {
        btnCalculate.disabled = false;
        btnSave.disabled = false;
        btnSaveAs.disabled = false;
        
        const leftHtml = `<div class="scrollable">
            <div class="fd-item"><strong>Файл: ${appState.currentFile?.name || 'загружен'}</strong></div>
            <div class="fd-item"><strong>Количество атрибутов (N): ${appState.originalN}</strong></div>
            <div class="fd-item"><strong>Количество исходных ФЗ (KC1): ${appState.originalKc1}</strong></div>
            <div style="margin-top: 12px;"></div>
            ${formatFdsList(appState.originalKubList.slice(0, appState.originalKc1), appState.originalN, 1)}
        </div>`;
        leftPanel.innerHTML = leftHtml;
    } else {
        btnCalculate.disabled = true;
        btnSave.disabled = true;
        btnSaveAs.disabled = true;
        leftPanel.innerHTML = '<div class="placeholder">Нет загруженных данных</div>';
    }
    
    if (appState.closureResult && appState.closureResult.length > 0) {
        const originalSet = new Set(appState.originalKubList.slice(0, appState.originalKc1));
        const orderedOriginal = [];
        for (let i = 0; i < appState.originalKc1; i++) {
            const cube = appState.originalKubList[i];
            if (originalSet.has(cube)) orderedOriginal.push(cube);
        }
        const newCubes = appState.closureResult.filter(cube => !originalSet.has(cube));
        const orderedResult = orderedOriginal.concat(newCubes);
        
        const rightHtml = `<div class="scrollable">
            <div class="fd-item"><strong>Замыкание системы ФЗ</strong></div>
            <div class="fd-item"><strong>Всего ФЗ в замыкании: ${orderedResult.length}</strong></div>
            <div style="margin-top: 12px;"></div>
            ${formatFdsList(orderedResult, appState.originalN, 1)}
        </div>`;
        rightPanel.innerHTML = rightHtml;
    } else {
        rightPanel.innerHTML = '<div class="placeholder">Нет результатов</div>';
    }
    
    statusBar.textContent = appState.resultSaved ? 
        `Готов. Файл: ${appState.currentFile?.name || 'не загружен'}` :
        `Результат не сохранён. Файл: ${appState.currentFile?.name || 'не загружен'}`;
}

async function openFile() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) {
        console.error("fileInput not found");
        return;
    }
    
    fileInput.value = '';
    fileInput.click();
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const { kubList, n, kc1 } = await parseXmlFile(file);
            appState.currentFile = file;
            appState.originalKubList = kubList;
            appState.originalN = n;
            appState.originalKc1 = kc1;
            appState.closureCubes = null;
            appState.closureResult = null;
            appState.resultSaved = true;
            updateUI();
            document.getElementById('statusBar').textContent = `Файл загружен: ${file.name}`;
        } catch (err) {
            document.getElementById('statusBar').textContent = `Ошибка: ${err.message}`;
            console.error(err);
        }
    };
}

function saveToFile(filename, content) {
    const blob = new Blob([content], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function saveFile() {
    if (!appState.closureCubes) {
        alert("Нет результатов для сохранения. Сначала выполните расчёт.");
        return;
    }
    
    const fileName = appState.currentFile ? appState.currentFile.name.replace(/\.xml$/i, '_closure.xml') : 'closure.xml';
    const xmlContent = writeXmlResult(
        appState.originalKubList,
        appState.originalKc1,
        appState.closureCubes,
        appState.closureCubes.length,
        appState.originalN
    );
    saveToFile(fileName, xmlContent);
    appState.resultSaved = true;
    updateUI();
}

function saveAsFile() {
    if (!appState.closureCubes) {
        alert("Нет результатов для сохранения. Сначала выполните расчёт.");
        return;
    }
    
    const fakeInput = document.createElement('input');
    fakeInput.type = 'file';
    fakeInput.style.display = 'none';
    document.body.appendChild(fakeInput);
    
    fakeInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const xmlContent = writeXmlResult(
                appState.originalKubList,
                appState.originalKc1,
                appState.closureCubes,
                appState.closureCubes.length,
                appState.originalN
            );
            saveToFile(file.name, xmlContent);
            appState.resultSaved = true;
            updateUI();
        }
        document.body.removeChild(fakeInput);
    };
    
    fakeInput.click();
}

function calculate() {
    if (!appState.originalKubList) {
        alert("Сначала откройте файл с исходными данными.");
        return;
    }
    
    document.getElementById('statusBar').textContent = "Вычисление замыкания...";
    console.log("=== CALCULATE START ===");
    console.log("originalKubList:", appState.originalKubList);
    console.log("originalN:", appState.originalN);
    console.log("originalKc1:", appState.originalKc1);
    
    setTimeout(() => {
        try {
            const { kub, ic } = kimpl1(appState.originalKubList, appState.originalN, appState.originalKc1);
            console.log("Result from kimpl1:", { kub, ic });
            appState.closureCubes = kub;
            appState.closureResult = kub;
            appState.resultSaved = false;
            updateUI();
            document.getElementById('statusBar').textContent = `Вычисление завершено. Всего ФЗ: ${ic}`;
        } catch (err) {
            console.error("Error in calculate:", err);
            document.getElementById('statusBar').textContent = `Ошибка: ${err.message}`;
            alert("Ошибка при вычислении: " + err.message);
        }
    }, 100);
}

// Инициализация интерфейса
document.getElementById('btnOpen').addEventListener('click', openFile);
document.getElementById('btnSave').addEventListener('click', saveFile);
document.getElementById('btnSaveAs').addEventListener('click', saveAsFile);
document.getElementById('btnCalculate').addEventListener('click', calculate);

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        openFile();
    } else if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        saveFile();
    } else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        saveAsFile();
    } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        calculate();
    }
});

updateUI();