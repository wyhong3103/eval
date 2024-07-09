import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import "highlight.js/styles/base16/solarized-light.css";
import Editor from "react-simple-code-editor";
import "./App.css";
import { useState } from "react";
hljs.registerLanguage("cpp", cpp);

function App() {
  const [code, setCode] = useState(`function add(a, b) {\n  return a + b;\n}`);
  const [output, setOutput] = useState("Please run your code.");
  return (
    <div className="App">
      <div className="heading">
        <h1>eval</h1>
      </div>
      <div className="container">
        <div className="left-container">
          <div className="editor-container">
            <Editor
              value={code}
              highlight={(code) =>
                hljs.highlight(code, { language: "cpp" }).value
              }
              onValueChange={(code) => setCode(code)}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 12,
              }}
              textareaClassName="editor"
            />
          </div>
          <div className="submit-container">
            <div className="submit-btn">run</div>
          </div>
        </div>
        <div className="output">{output}</div>
      </div>
    </div>
  );
}

export default App;
