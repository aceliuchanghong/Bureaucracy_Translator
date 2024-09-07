import {splitTextIntoChunks} from './chunk.js';

document.getElementById('processButton').addEventListener('click', processText);

async function processText() {
    const inputText = document.getElementById('inputText').value;
    const chunks = splitTextIntoChunks(inputText);

    const container = document.querySelector('.container');
    container.querySelectorAll('.output-row').forEach(el => el.remove());

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const aiResponseForChunk = await getAIResponse(chunk);

        console.log(`Chunk ${i + 1}:`, chunk);
        console.log(`AI Response for Chunk ${i + 1}:`, aiResponseForChunk);

        const rowDiv = document.createElement('div');
        rowDiv.className = 'output-row';

        const leftTextarea = createOutputTextarea('output left', chunk);
        const rightTextarea = createOutputTextarea('output right', aiResponseForChunk);

        rowDiv.appendChild(leftTextarea);
        rowDiv.appendChild(rightTextarea);
        container.appendChild(rowDiv);

        setTimeout(() => {
            leftTextarea.style.opacity = 1;
            rightTextarea.style.opacity = 1;
        }, i * 300);
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



