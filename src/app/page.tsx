"use client";

import { useState } from 'react';

const commitHistory = `b1c35e7 - Shirashoji, 24 minutes ago : feat: Remove obsolete test network files in GML and GraphML formats
e9f1c61 - Shirashoji, 68 minutes ago : feat: Improve logging and formatting in centrality calculation and visualization updates
8467f09 - Shirashoji, 68 minutes ago : feat: Enhance centrality calculation and visualization tools with improved error handling, progress reporting, and metadata insights
5c55078 - Shirashoji, 2 hours ago : feat: Enhance AGENTS.md with MCP tools usage guidelines and best practices for quality assurance
697450a - Shirashoji, 2 hours ago : feat: Implement responsive scrolling and mobile toggle for chat panel in NetworkChatPage
ca489a6 - Shirashoji, 2 hours ago : docs: Update API endpoints and LLM provider configuration details in documentation
545d17a - Shirashoji, 2 hours ago : fix: Clean up formatting in QUICK_START.md and add missing API call examples for user registration and token retrieval
7326c29 - Shirashoji, 2 hours ago : feat: Add comprehensive documentation for NetworkX MCP server architecture, new features, network layout API, and testing guide
e644753 - Shirashoji, 2 hours ago : Fix Docker Compose configuration to reference the correct FastAPI application module
f80224d - Shirashoji, 14 hours ago : Add network operations and visualization tools, enhance structure validation, and update frontend integration
bbfadc3 - Shirashoji, 15 hours ago : feat: Implement rate limiting for API endpoints and enhance LLM provider settings in NetworkChatPage
78ba2bd - Shirashoji, 16 hours ago : feat: Implement LLM provider and model selection with API integration in NetworkChatPage
c7f166a - Shirashoji, 16 hours ago : feat: Enhance Navbar mobile menu functionality and improve layout in NetworkChatPage
8b8bb25 - Shirashoji, 16 hours ago : feat: Integrate Tailwind CSS forms plugin and enhance styling in SettingsPage
1e4a80d - Shirashoji, 16 hours ago : feat: Add LLM provider settings management and UI
17dceec - Shirashoji, 18 hours ago : refactor: remove compiled Python bytecode file from repository
3459831 - Shirashoji, 18 hours ago : refactor: update .gitignore to improve clarity and add new entries for Redis, RabbitMQ, ActiveMQ, and Streamlit
02ab4a2 - Shirashoji, 18 hours ago : chore: update dependencies in frontend package.json
0181439 - Shirashoji, 19 hours ago : Add comprehensive testing guide, Docker Compose configuration, and test runner script
b241936 - Shirashoji, 21 hours ago : refactor: standardize quotes and improve formatting in HomePage and NetworkVisualizationPage components
f80653a - Shirashoji, 21 hours ago : feat: add new layout algorithms and update frontend options for network visualization
387e73e - Shirashoji, 21 hours ago : Remove unused scripts and GraphML files related to user creation and graph handling. This includes the deletion of create_user.py, fixed_random_graph_25_nodes.graphml, fixed_random_graph_25_nodes_converted.graphml, and various test scripts for GraphML conversion and system integration tests. These changes streamline the codebase by eliminating obsolete components.
acd6dd4 - Shirashoji, 21 hours ago : Add network metrics calculations, analysis tools, and caching mechanism
717d5e9 - Shirashoji, 23 hours ago : chore: add initial frontend package.json with dependencies and scripts`;

export default function Home() {
  const [dailyReport, setDailyReport] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [advice, setAdvice] = useState('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  const generateReport = async () => {
    setDailyReport("日報生成中...");
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commits: commitHistory }),
      });
      const data = await response.json();
      setDailyReport(data.report);
    } catch (error) {
      console.error("Error generating report:", error);
      setDailyReport("日報の生成に失敗しました。");
    }
  };

  const postToEsa = async () => {
    setIsPosting(true);
    setPostResult(null);
    try {
      const response = await fetch('/api/post-to-esa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report: dailyReport }),
      });
      const data = await response.json();
      if (data.success) {
        setPostResult(`esa.ioへの投稿に成功しました: ${data.data.url}`);
      } else {
        setPostResult(`esa.ioへの投稿に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error("Error posting to esa.io:", error);
      setPostResult("esa.ioへの投稿に失敗しました。");
    } finally {
      setIsPosting(false);
    }
  };

  const getAdvice = async () => {
    setIsGeneratingAdvice(true);
    setAdvice('アドバイスを生成中...');
    try {
      const [templateRes, pastReportsRes] = await Promise.all([
        fetch('/7353.md'),
        fetch('/api/get-past-reports'),
      ]);

      const template = await templateRes.text();
      const { reports: pastReports } = await pastReportsRes.json();

      const adviceRes = await fetch('/api/generate-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template, pastReports, commits: commitHistory }),
      });

      const { advice } = await adviceRes.json();
      setAdvice(advice);
    } catch (error) {
      console.error("Error generating advice:", error);
      setAdvice("アドバイスの生成に失敗しました。");
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">日報作成ツール</h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">コミット履歴</h2>
          <pre className="bg-gray-100 p-2 rounded-md overflow-auto h-96">{commitHistory}</pre>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">生成された日報</h2>
          <textarea
            className="w-full h-96 p-2 border rounded-md"
            value={dailyReport}
            onChange={(e) => setDailyReport(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={generateReport}
        >
          日報を生成
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
          onClick={postToEsa}
          disabled={!dailyReport || isPosting}
        >
          {isPosting ? '投稿中...' : 'esa.ioに投稿'}
        </button>
      </div>
      {postResult && <p className="mt-4 text-green-600">{postResult}</p>}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">日報作成アドバイス</h2>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
          <button
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mb-4"
            onClick={getAdvice}
            disabled={isGeneratingAdvice}
          >
            {isGeneratingAdvice ? 'アドバイス生成中...' : 'アドバイスを生成'}
          </button>
          {advice && <pre className="whitespace-pre-wrap">{advice}</pre>}
        </div>
      </div>

    </div>
  );
}
