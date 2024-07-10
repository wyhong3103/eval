import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import "highlight.js/styles/base16/solarized-light.css";
import Editor from "react-simple-code-editor";
import "./App.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
hljs.registerLanguage("cpp", cpp);

const socket = io("http://localhost:6969/");

function App() {
  const [code, setCode] = useState(
    `#include <iostream> \n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}`
  );
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("Standard Output");
  const [ok, setOK] = useState(1);
  const [input, setInput] = useState("");

  const submit = () => {
    socket.emit("submit", JSON.stringify({ code, input }));
    setRunning(true);
    setOutput("Running...");
    setOK(1);
  };

  useEffect(() => {
    socket.on("result", (output, status) => {
      setOutput(output);
      setOK(status);
      setRunning(false);
    });
  }, [socket]);

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
            <div
              className={`submit-btn ${!running ? "enabled" : "disabled"}`}
              onClick={!running ? submit : null}
            >
              run
            </div>
          </div>
        </div>
        <div className="right-container">
          <div className="section-title">input</div>
          <textarea
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Standard Input"}
          />
          <div className="section-title">output</div>
          <textarea
            className="output"
            style={{
              color: ok ? "black" : "red",
            }}
            value={output}
            disabled
          />
        </div>
      </div>
    </div>
  );
}

export default App;
