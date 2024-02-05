
function generateTable() {
    let width = parseInt(document.getElementById("width").value) + 1; // + 1 for epsilon transitions
    let height = parseInt(document.getElementById("height").value);

    let table = document.getElementById("input-table");

    let type = document.getElementById("transition-type").value;
    transitionType = type.slice(0, width - 1);
    transitionType += "ε";

    // cache old inputs
    let oldInputs = [];
    let oldHeight = table.children[0].children.length - 1;
    let oldWidth = table.children[0].children[1].children.length - 1;
    for (let i = 0; i < oldHeight; i++) {
        let row = [];
        for (let j = 0; j < oldWidth; j++) {
            let cell = document.getElementById(`cell${i}${j}`);
            row.push(cell.value);
        }
        oldInputs.push(row);
    }

    table.innerHTML = "";

    var tbody = document.createElement("tbody");

    for (let i = 0; i < height + 1; i++) {
        let row = document.createElement("tr");
        if (i === 0) {
            row.appendChild(document.createElement("th"));
            for (let j = 0; j < width; j++) {
                let cell = document.createElement("th");
                cell.innerText = transitionType[j];
                row.appendChild(cell);
            }
            tbody.appendChild(row);
            continue;
        }
        let cell = document.createElement("td");
        cell.innerText = statePrefix + (i - 1);
        row.appendChild(cell);

        for (let j = 0; j < width; j++) {
            let cell = document.createElement("td");
            let input = document.createElement("input");
            input.type = "text";
            input.id = `cell${(i - 1)}${j}`;
            input.addEventListener("change", generateSVG);
            if (i <= oldHeight && j < oldWidth - 1) {
                input.value = oldInputs[i - 1][j];
            }

            if(i <= oldHeight && j === width - 1) {
                input.value = oldInputs[i - 1][oldWidth - 1];
            }


            cell.appendChild(input);
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }

    table.appendChild(tbody);

    generateButtons();
}

document.getElementById("width").addEventListener("change", generateTable);
document.getElementById("height").addEventListener("change", generateTable);


document.getElementById("state-prefix").addEventListener("change", () => {
    statePrefix = document.getElementById("state-prefix").value;

    // update all first elements in table rows
    let table = document.getElementById("input-table").children[0];
    for (let i = 1; i < table.children.length; i++) {
        table.children[i].children[0].innerText = statePrefix + (i - 1);
    }
});

document.getElementById("transition-type").addEventListener("change", () => {
    let width = parseInt(document.getElementById("width").value) + 1; // + 1 for epsilon transitions
    let type = document.getElementById("transition-type").value;
    let header = document.getElementById("input-table").children[0].children[0].children;
    transitionType = type.slice(0, width - 1);
    transitionType += "ε";

    for (let i = 1; i < header.length; i++) {
        header[i].innerText = type[i - 1];
    }
});

document.getElementById("copy").addEventListener("click", () => {
    let svg = document.getElementById("output");
    navigator.clipboard.writeText(svg.outerHTML.replace(`id="output" `, ""));

    copiedMessage();
});

document.getElementById("copyMdTable").addEventListener("click", () => {
    let table = getTable();
    let md = "| |";
    for (let i = 0; i < table[0].length; i++) {
        md += ` ${transitionType[i]} |`;
    }
    md += "\n|---|";
    for (let i = 0; i < table[0].length; i++) {
        md += "---|";
    }
    md += "\n";
    for (let i = 0; i < table.length; i++) {
        md += `| ${statePrefix}${i} |`;
        for (let j = 0; j < table[i].length; j++) {
            let text = " " + table[i][j].split(",").map(x => statePrefix + x).join(",") + " |";
            md += text;
        }
        md += "\n";
    }
    navigator.clipboard.writeText(md);

    copiedMessage();
});

document.getElementById("copyLatex").addEventListener("click", () => {
    let scale = 30;

    let ret = "%% include in preamble:\n%% \\usepackage{tikz}\n%% \\usetikzlibrary{automata,positioning,arrows}\n\\begin{center}\n\\begin{tikzpicture}[]";

    let [statePositions, initialStates, finalStates, labels] = getPositions();

    for (let i = 0; i < statePositions.length; i++) {
        ret += `\n\\node[state`;
        if (initialStates.includes(i)) {
            ret += ", initial";
        }
        if (finalStates.includes(i)) {
            ret += ", accepting, thick";
        }
        ret += `] (${statePrefix}${i}) at (${statePositions[i][0]/scale}, ${statePositions[i][1]/scale}) {${statePrefix}${i}};`;
    }

    // add transition lines
    for (let y = 0; y < labels.length; y++) {
        for (let x = 0; x < labels[y].length; x++) {
            if (labels[y][x].length === 0) {
                continue;
            }

            let transitionTo = x;

            let labelText = "";
            for (let i = 0; i < labels[y][x].length; i++) {
                labelText += transitionType[labels[y][x][i]];
                if (i !== labels[y][x].length - 1) {
                    labelText += ",";
                }
            }
            
            if(y === x) {
                // transition to self
                ret += `\n\\path[->] (${statePrefix}${y}) edge [in=90, out=180, loop] node {$${labelText}$} ();`;
            } else {
                // create edge positioning in the form of [in=angle, out=angle]
                let inAngle = Math.atan2(statePositions[y][1] - statePositions[x][1], statePositions[y][0] - statePositions[x][0]) * 180 / Math.PI;
                let outAngle = Math.atan2(statePositions[x][1] - statePositions[y][1], statePositions[x][0] - statePositions[y][0]) * 180 / Math.PI;

                // offset by 11 degrees to the left
                inAngle -= 11;
                outAngle += 11;
    
                ret += `\n\\path[->] (${statePrefix}${y}) edge [in=${inAngle}, out=${outAngle}] node {$${labelText}$} (${statePrefix}${x});`;
            }      
        }
    }

    ret += "\\end{tikzpicture}\n\\end{center}";
    navigator.clipboard.writeText(ret);
    
    copiedMessage();
});

document.getElementById("copyLatexTable").addEventListener("click", () => {
    let table = getTable();
    let ret = "\\begin{center}\n\\begin{tabular}{|c|";
    for (let i = 0; i < table[0].length; i++) {
        ret += "c|";
    }
    ret += "}\n\\hline\n";
    ret += " &";
    for (let i = 0; i < table[0].length; i++) {
        ret += ` $${transitionType[i]}$ &`;
    }
    ret = ret.slice(0, -1);
    ret += "\\\\\n\\hline\n";
    for (let i = 0; i < table.length; i++) {
        ret += ` $${statePrefix}${i}$ &`;
        for (let j = 0; j < table[i].length; j++) {
            ret += ` $${statePrefix}${table[i][j]}$ &`;
        }
        ret = ret.slice(0, -1);
        ret += "\\\\\n\\hline\n";
    }
    ret += "\\end{tabular}\n\\end{center}";
    navigator.clipboard.writeText(ret);

    copiedMessage();    
});


document.getElementById("download-light").addEventListener("click", () => {
    let svg = document.getElementById("output");
    let svgData = svg.outerHTML.replace(`id="output" `, "");
    svgData = svgData.replaceAll("var(--back)", "#ffffff");
    svgData = svgData.replaceAll("var(--text)", "#000000");
    let svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "automata.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

document.getElementById("download-dark").addEventListener("click", () => {
    let svg = document.getElementById("output");
    let svgData = svg.outerHTML.replace(`id="output" `, "");
    svgData = svgData.replaceAll("var(--back)", "#090f16");
    svgData = svgData.replaceAll("var(--text)", "#c7d6ff");
    let svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "automata.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

document.getElementById("handles").addEventListener("mousemove", (e) => {
    if (activeHandle !== -1) {
        stateHandles[activeHandle] = [e.offsetX, e.offsetY];
        document.getElementById("handle" + activeHandle).style.left = `${e.offsetX-10}px`;
        document.getElementById("handle" + activeHandle).style.top = `${e.offsetY-10}px`;
    }
});

document.getElementById("handles").addEventListener("mouseup", (e) => {
    document.getElementById("handle" + activeHandle).style.display = "block";
    activeHandle = -1;
});

document.getElementById("toggleHandle").addEventListener("click", () => {
    // switch --handle-color between #c7d6ff and #00000000 in root
    let root = document.documentElement.style;
    let color = root.getPropertyValue("--handle-color");
    if (color === "#c7d6ff") {
        root.setProperty("--handle-color", "#00000000");
        document.getElementById("toggleHandle").innerText = "show handles";
    } else {
        root.setProperty("--handle-color", "#c7d6ff");
        document.getElementById("toggleHandle").innerText = "hide handles";
    }    
});


document.getElementById("diagram-width").addEventListener("change", () => {
    diagramWidth = parseInt(document.getElementById("diagram-width").value);
});
document.getElementById("diagram-height").addEventListener("change", () => {
    diagramHeight = parseInt(document.getElementById("diagram-height").value);
});