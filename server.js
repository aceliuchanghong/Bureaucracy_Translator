const express = require('express');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();
const fs = require('fs');

const app = express();
const model = process.env.MODEL;
const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT;
const API_KEY = process.env.DEEPSEEK_API_KEY;

const openai = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY
});
// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 解析请求体
app.use(express.json());

// 打印 API key
// console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY);
const systemPrompt = `
二字关键词:
漏斗，中台，闭环，打法，纽带，矩阵，刺激，规模，场景，维度，格局，形态，生态，体系，认知，玩法，体感，感知，调性，心智，战役，合力，赛道，基因，模型，载体，横向，通道，补位，试点，布局，联动，价值，细分，梳理，提炼，支撑，解法，脑暴，分层，心力 二字动词：复盘，赋能，加持，沉淀，倒逼，落地，串联，协同，反哺，兼容，包装，重组，履约，响应，量化，布局，联动，细分，梳理，输出，加速，共建，支撑，融合，聚合，集成，对标，聚焦，抓手，拆解，抽象，摸索，提炼，打通，打透，吃透，迁移，分发，分装，辐射，围绕，复用，渗透，扩展，开拓，皮实，共创，共建，解耦，集成，对齐，拉齐，对焦，给到，拿到，死磕 

三字关键词：
感知度，方法论，组合拳，引爆点，点线面，精细化，差异化，平台化，结构化，影响力，耦合性，便捷性，一致性，端到端，短平快，护城河，体验感，颗粒度 

四字关键词：
生命周期，价值转化，强化认知，资源倾斜，完善逻辑，抽离透传，复用打法，商业模式，快速响应，定性定量，关键路径，去中心化，结果导向，垂直域，归因分析，体验度量，信息屏障，资源整合。

示例输入句子：
这个问题你准备怎么解决？

然后将句子整合上述关键字之后的示例JSON输出:
{
    "original_text": "<此处填写原始文本>",
    "complexified_text": "项目管理底层逻辑是打通信息屏障，创建项目新生态，顶层实际是聚焦用户感知赛道，通过差异化和颗粒度达到引爆点，交付价值是在采用复用打法达成持久受益，抽离透传归因分析作为抓手为产品赋能，体验度量作为闭环的评判标准，亮点为载体，优势为链路，思考整个项目生命周期，完善逻辑考虑资源倾斜，是组合拳，最终达到平台标准化"
}
`;

// 返回首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 处理 AI 请求
app.post('/api/get-ai-response', async (req, res) => {
    const {chunk} = req.body;
    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {role: 'system', content: systemPrompt},
                {role: 'user', content: chunk}
            ],
            response_format: {'type': 'json_object'}
        });

        const responseContent = completion?.choices?.[0]?.message?.content;

        // 保存到 user_post.log
        fs.appendFile('user_post.log', responseContent + '\n', (err) => {
            if (err) {
                console.error('写入日志文件时出错:', err);
            }
        });

        console.log(responseContent);

        let jsonResponse;

        // 尝试解析为 JSON，并提取 "complexified_text"
        try {
            jsonResponse = JSON.parse(responseContent);
            if (jsonResponse.complexified_text) {
                res.json({response: jsonResponse.complexified_text});
            } else {
                throw new Error('Missing complexified_text');
            }
        } catch (parseError) {
            console.error('JSON 解析错误:', parseError.message);
            res.json({response: responseContent});
        }
    } catch (error) {
        console.error('AI 生成错误:', error.message);
        res.status(500).json({error: 'AI 生成错误'});
    }
});

// 将文件大小限制传递给客户端
app.get('/config', (req, res) => {
    res.json({ maxFileSize: process.env.MAX_FILE_SIZE || 20000 });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
