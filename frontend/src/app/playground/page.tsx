'use client';

import { useState, useCallback } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Code, Play, RotateCcw, Terminal } from 'lucide-react';

const languages = [
  { id: 'html', label: 'HTML/CSS/JS', defaultCode: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; padding: 20px; }\n    h1 { color: #3b82f6; }\n  </style>\n</head>\n<body>\n  <h1>Hello, JoyEdu!</h1>\n  <p>Edit this code and see the result.</p>\n  <script>\n    console.log("Hello from JoyEdu Playground!");\n  </script>\n</body>\n</html>' },
  { id: 'javascript', label: 'JavaScript', defaultCode: '// JavaScript Playground\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log("Fibonacci sequence:");\nfor (let i = 0; i < 10; i++) {\n  console.log(`fib(${i}) = ${fibonacci(i)}`);\n}' },
  { id: 'typescript', label: 'TypeScript', defaultCode: '// TypeScript Playground\n\ninterface User {\n  name: string;\n  age: number;\n  email: string;\n}\n\nfunction greet(user: User): string {\n  return `Hello, ${user.name}! You are ${user.age} years old.`;\n}\n\nconst user: User = {\n  name: "Alice",\n  age: 30,\n  email: "alice@example.com"\n};\n\nconsole.log(greet(user));' },
  { id: 'css', label: 'CSS', defaultCode: '/* CSS Playground */\n\n.card {\n  background: white;\n  border-radius: 12px;\n  padding: 24px;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n  transition: transform 0.2s;\n}\n\n.card:hover {\n  transform: translateY(-4px);\n}\n\n.title {\n  font-size: 24px;\n  font-weight: bold;\n  color: #1a1a1a;\n}' },
];

export default function PlaygroundPage() {
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [code, setCode] = useState(languages[0].defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const handleLanguageChange = (lang: typeof languages[number]) => {
    setSelectedLang(lang);
    setCode(lang.defaultCode);
    setOutput('');
    setPreviewHtml('');
  };

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput('');

    if (selectedLang.id === 'html') {
      setPreviewHtml(code);
      setOutput('HTML rendered in preview pane.');
      setIsRunning(false);
      return;
    }

    try {
      const result = await api.post<{ output: string | null; error: string | null; executionTime: number }>(
        '/coding/run',
        { code, language: selectedLang.id.toUpperCase() },
      );
      setOutput(result.output || result.error || 'No output');
    } catch (err) {
      setOutput(err instanceof Error ? err.message : 'Execution error');
    } finally {
      setIsRunning(false);
    }
  }, [code, selectedLang]);

  const handleReset = () => {
    setCode(selectedLang.defaultCode);
    setOutput('');
    setPreviewHtml('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Code className="h-8 w-8 text-primary" />
                Coding Playground
              </h1>
              <p className="text-muted-foreground mt-1">
                Write, run, and experiment with code in your browser
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {languages.map((lang) => (
              <Badge
                key={lang.id}
                variant={selectedLang.id === lang.id ? 'default' : 'outline'}
                className="cursor-pointer text-sm px-3 py-1"
                onClick={() => handleLanguageChange(lang)}
              >
                {lang.label}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Editor</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleRun} disabled={isRunning}>
                    <Play className="h-4 w-4 mr-1" />
                    {isRunning ? 'Running...' : 'Run'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm bg-zinc-950 text-green-400 resize-none focus:outline-none rounded-b-lg"
                  spellCheck={false}
                />
              </CardContent>
            </Card>

            {/* Output */}
            <div className="flex flex-col gap-4">
              {selectedLang.id === 'html' && previewHtml && (
                <Card className="h-[350px]">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[290px] bg-white rounded-b-lg"
                      sandbox="allow-scripts"
                      title="preview"
                    />
                  </CardContent>
                </Card>
              )}

              <Card className={selectedLang.id === 'html' && previewHtml ? 'h-[230px]' : 'h-[600px]'}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Console Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <pre className="w-full h-full p-4 font-mono text-sm bg-zinc-950 text-zinc-300 overflow-auto rounded-b-lg whitespace-pre-wrap">
                    {output || 'Click "Run" to execute your code...'}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
