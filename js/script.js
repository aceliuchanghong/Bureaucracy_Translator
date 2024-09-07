import {splitTextIntoChunks} from './chunk.js';

document.getElementById('processButton').addEventListener('click', processText);
document.getElementById('downloadButton').addEventListener('click', downloadText);

async function processText() {
    const inputText = document.getElementById('inputText').value;
    const splitOption = document.getElementById('splitOption').value;

    let chunks;
    if (splitOption === 'split') {
        chunks = splitTextIntoChunks(inputText); // 切分文本
    } else {
        chunks = [inputText]; // 不切分，整个文本作为一个chunk
    }

    const container = document.querySelector('.container');
    container.querySelectorAll('.output-row').forEach(el => el.remove()); // 清空旧结果

    const processedChunks = []; // 存储所有处理后的文本

    // 创建所有块的行和文本区域
    const rowElements = chunks.map((chunk, i) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'output-row';

        const leftTextarea = createOutputTextarea('output left', chunk);
        const rightTextarea = createOutputTextarea('output right', ''); // 先留空，稍后填充AI的回复
        const loadingSpinner = createLoadingSpinner();

        rowDiv.appendChild(leftTextarea);
        rowDiv.appendChild(loadingSpinner);
        container.appendChild(rowDiv);

        setTimeout(() => {
            leftTextarea.style.opacity = 1;
            loadingSpinner.style.opacity = 1;
        }, i * 300);

        return { rowDiv, loadingSpinner, rightTextarea, chunk };
    });

    // 并发处理所有 chunk 的 AI 回复
    const promises = rowElements.map(async ({ rowDiv, loadingSpinner, rightTextarea, chunk }) => {
        try {
            const aiResponseForChunk = await getAIResponse(chunk);
            rightTextarea.value = aiResponseForChunk;
            rowDiv.replaceChild(rightTextarea, loadingSpinner); // 替换加载动画为AI回复
            rightTextarea.style.opacity = 1;
            processedChunks.push(aiResponseForChunk); // 保存 AI 的回复
        } catch (error) {
            console.error('Error fetching AI response:', error);
            rightTextarea.value = 'AI 请求失败';
            rowDiv.replaceChild(rightTextarea, loadingSpinner);
            rightTextarea.style.opacity = 1;
        }
    });

    // 等待所有 AI 请求完成
    await Promise.all(promises);

    // 当文本处理完成后显示下载按钮
    if (processedChunks.length > 0) {
        document.getElementById('downloadButton').style.display = 'inline-block';
        document.getElementById('downloadButton').dataset.text = processedChunks.join('\n'); // 将所有处理好的文本合并
    }
}

function createOutputTextarea(className, value) {
    const textarea = document.createElement('textarea');
    textarea.className = className;
    textarea.value = value;
    textarea.readOnly = true;
    textarea.style.opacity = 0;
    return textarea;
}

async function getAIResponse(chunk) {
    try {
        const response = await fetch('/api/get-ai-response', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({chunk})
        });

        if (!response.ok) throw new Error('网络请求失败');
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error fetching AI response:', error);
        return 'AI 请求失败';
    }
}

function createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    return spinner;
}

function downloadText() {
    const text = document.getElementById('downloadButton').dataset.text;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_text.txt';
    a.click();
    window.URL.revokeObjectURL(url); // 释放内存
}



