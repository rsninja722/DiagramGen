let statePositions = [];
let stateHandles = [];
let activeHandle = -1;
let labelPoses = [];
let statePrefix = "s";
let transitionType = "0123456789";
let diagramWidth = 0;
let diagramHeight = 0;

const radius = 20;
const spacing = 100;
const charWidth = 10;

function getTable() {
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);

    let table = [];
    for (let i = 0; i < height; i++) {
        let row = [];
        for (let j = 0; j < width; j++) {
            let cell = document.getElementById(`cell${i}${j}`);
            row.push(cell.value);
        }
        table.push(row);
    }
    return table;
}

function createPositions(states) {
    statePositions = [];
    stateHandles = [];
    document.getElementById("handles").innerHTML = "";

    let statesSqrt = Math.ceil(Math.sqrt(states));
    let yoffset = 0;

    for (let i = 0; i < states; i++) {
        let x = (i % statesSqrt) * spacing;
        if (i % statesSqrt === 0 && i !== 0) {
            yoffset++;
        }
        statePositions.push([x + (spacing / 2), yoffset * spacing + (spacing / 2)]);
        stateHandles.push([x + (spacing / 2), yoffset * spacing + (spacing / 2)]);
        
        let handle = document.createElement("div");
        handle.classList.add("handle");
        handle.id = "handle" + i;
        handle.style.left = `${stateHandles[i][0]}px`;
        handle.style.top = `${stateHandles[i][1]}px`;
        handle.addEventListener("mousedown", (e) => {
            if(activeHandle === -1) {
                activeHandle = i;
                e.target.style.display = "none";
            } else {
                activeHandle = -1;
                e.target.style.display = "block";
            }
        });

        document.getElementById("handles").appendChild(handle);
    }
    
    diagramWidth = (statesSqrt) * spacing;
    diagramHeight = (statesSqrt) * spacing;

    document.getElementById("diagram-width").value = diagramWidth;
    document.getElementById("diagram-height").value = diagramHeight;
}

function getPositions() {
    let table = getTable();
    let states = parseInt(document.getElementById("height").value);

    let initialStates = [];
    for(let i = 0; i < states; i++) {
        if(document.getElementById(`initial${i}`).checked) {
            initialStates.push(i);
        }
    }
    let finalStates = [];
    for(let i = 0; i < states; i++) {
        if(document.getElementById(`final${i}`).checked) {
            finalStates.push(i);
        }
    }
    
    // generate positions
    let statesSqrt = Math.ceil(Math.sqrt(states));
    let yoffset = 0;

    if (statePositions.length !== states) {
        createPositions(states);
    }

    for(let i = 0; i < states; i++) {
        for(let j =0;j<labelPoses.length;j++) { 
            let distance = Math.sqrt(Math.pow(statePositions[i][0] - labelPoses[j][0], 2) + Math.pow(statePositions[i][1] - labelPoses[j][1], 2));
            let angle = Math.atan2(labelPoses[j][1] - statePositions[i][1], labelPoses[j][0] - statePositions[i][0]);

            if(distance < radius*1.2) {
                if(distance < 0.1) {
                    statePositions[i][0] += 1;
                    statePositions[i][1] += 1;
                    continue;
                }

                statePositions[i][0] -= Math.cos(angle) * (4-Math.pow(distance, 0.3));
                statePositions[i][1] -= Math.sin(angle) * (4-Math.pow(distance, 0.3));
            }
        }
    }

    // go through all state handles and their respective states towards them
    let speed = 5;
    for(let i = 0; i < states; i++) {
        let x = statePositions[i][0];
        let y = statePositions[i][1];
        let x2 = stateHandles[i][0];
        let y2 = stateHandles[i][1];

        let angle = Math.atan2(y2 - y, x2 - x);
        let distance = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));

        if(distance > 5) {
            let x = 1 - Math.pow(1 - distance / 500, 5);

            statePositions[i][0] += Math.cos(angle) * speed * x * 10;
            statePositions[i][1] += Math.sin(angle) * speed * x * 10;
        }
    }

    /*
    let dampening = 0.1;

    for (let i = 0; i < states; i++) {
        let x = statePositions[i][0];
        let y = statePositions[i][1];

        // push away from nearest wall
        let top = 0;
        let bottom = (statesSqrt + 1) * spacing;
        let left = 0;
        let right = (statesSqrt + 1) * spacing;

        if (y < (top + spacing / 2)) {
            statePositions[i][1] += 10 * dampening;
        } else if (y > (bottom - spacing / 2)) {
            statePositions[i][1] -= 10 * dampening;
        }
        if (x < left + spacing / 2) {
            statePositions[i][0] += 10 * dampening;
        } else if (x > right - spacing / 2) {
            statePositions[i][0] -= 10 * dampening;
        }

        for (let j = 0; j < states; j++) {
            if (i === j) {
                continue;
            }

            // push state away from other states
            let x2 = statePositions[j][0];
            let y2 = statePositions[j][1];
            let angle = Math.atan2(y2 - y, x2 - x);
            let distance = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
            if (distance < spacing) {
                statePositions[i][0] -= Math.cos(angle) * dampening * 1000 * (1/distance);
                statePositions[i][1] -= Math.sin(angle) * dampening * 1000 * (1/distance);
            } else {
                statePositions[i][0] += Math.cos(angle) * dampening;
                statePositions[i][1] += Math.sin(angle) * dampening;
            }

            // transitions pull
            if (table[i][j] !== "" && !isNaN(table[i][j])) {
                let x2 = statePositions[table[i][j]][0];
                let y2 = statePositions[table[i][j]][1];

                let angle = Math.atan2(y2 - y, x2 - x);
                let distance = Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
                if (distance < spacing) {
                    statePositions[i][0] -= Math.cos(angle) * 0.5;
                    statePositions[i][1] -= Math.sin(angle) * 0.5;
                } else {
                    statePositions[i][0] += Math.cos(angle) * 0.5;
                    statePositions[i][1] += Math.sin(angle) * 0.5;
                }
            }

        }
    }
    */

    for(let i = 0; i < states; i++) {
        statePositions[i][0] = Math.round(statePositions[i][0]);
        statePositions[i][1] = Math.round(statePositions[i][1]);
    }

    labelPoses = [];

    let labels = table.map(() => table.map(() => []));

    for (let y = 0; y < table.length; y++) {
        for (let x = 0; x < table[y].length; x++) {
            if (table[y][x] === "") {
                continue;
            }
            let transitions = table[y][x].toString().split(",");

            for(let i = 0; i < transitions.length; i++) {
                if (parseInt(transitions[i]) >= states || isNaN(parseInt(transitions[i]))) {
                    continue;
                }

                let transitionTo = parseInt(transitions[i]);
                labels[y][transitionTo].push(x);
            }
        }
    }

    return [statePositions, initialStates, finalStates, labels];
}

function generateSVG() {
    let table = getTable();

    let svg = document.getElementById("output");
    svg.innerHTML = "";
    let states = parseInt(document.getElementById("height").value);


    let [statePositions, initialStates, finalStates, labels] = getPositions();

    // create layers
    let back = document.createElementNS("http://www.w3.org/2000/svg", "g");
    back.setAttribute("id", "back");
    svg.appendChild(back);
    let front = document.createElementNS("http://www.w3.org/2000/svg", "g");
    front.setAttribute("id", "front");
    svg.appendChild(front);
    let top = document.createElementNS("http://www.w3.org/2000/svg", "g");
    top.setAttribute("id", "top");
    svg.appendChild(top);

    // add states
    for (let i = 0; i < states; i++) {
        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", statePositions[i][0]);
        circle.setAttribute("cy", statePositions[i][1]);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", "var(--back)");
        circle.setAttribute("stroke", "var(--text)");

        // add initial state arrow
        if (initialStates.includes(i)) {
            let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", statePositions[i][0] - radius);
            line.setAttribute("y1", statePositions[i][1]);
            line.setAttribute("x2", statePositions[i][0] - radius * 2);
            line.setAttribute("y2", statePositions[i][1]);
            line.setAttribute("stroke", "var(--text)");
            back.appendChild(line);

            // small arrow pointing right
            let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            polygon.setAttribute("points", `${statePositions[i][0] - radius},${statePositions[i][1]} ${statePositions[i][0] - radius - 5},${statePositions[i][1] - 5} ${statePositions[i][0] - radius - 5},${statePositions[i][1] + 5}`);
            polygon.setAttribute("fill", "var(--text)");
            front.appendChild(polygon);
        }

        // add final state circle
        if (finalStates.includes(i)) {
            let end = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            end.setAttribute("cx", statePositions[i][0]);
            end.setAttribute("cy", statePositions[i][1]);
            end.setAttribute("r", radius * 0.8);
            end.setAttribute("fill", "none");
            end.setAttribute("stroke", "var(--text)");
            top.appendChild(end);
        }
        
        // add state label
        let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", statePositions[i][0]);
        label.setAttribute("y", statePositions[i][1]);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("dominant-baseline", "middle");
        label.setAttribute("fill", "var(--text)");
        label.innerHTML = statePrefix + i;
        front.appendChild(circle);
        top.appendChild(label);
    }

    // add transition lines
    for (let y = 0; y < labels.length; y++) {
        for (let x = 0; x < labels[y].length; x++) {
            if (labels[y][x].length === 0) {
                continue;
            }

            let transitionTo = x;

            // use trig to find start point and end point
            let angle = Math.atan2(statePositions[transitionTo][1] - statePositions[y][1], statePositions[transitionTo][0] - statePositions[y][0]);
            let x1 = Math.round(statePositions[y][0] + Math.cos(angle) * radius + Math.cos(angle - Math.PI / 2) * radius / 3);
            let y1 = Math.round(statePositions[y][1] + Math.sin(angle) * radius + Math.sin(angle - Math.PI / 2) * radius / 3);
            let x2 = Math.round(statePositions[transitionTo][0] - Math.cos(angle) * radius + Math.cos(angle - Math.PI / 2) * radius / 3);
            let y2 = Math.round(statePositions[transitionTo][1] - Math.sin(angle) * radius + Math.sin(angle - Math.PI / 2) * radius / 3);


            if(y === x) {
                // draw loop to self
                let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", statePositions[y][0] + radius / 2);
                circle.setAttribute("cy", statePositions[y][1] + radius / 2);
                circle.setAttribute("r", radius * 0.8);
                circle.setAttribute("fill", "none");
                circle.setAttribute("stroke", "var(--text)");
                back.appendChild(circle);
            } else {
                // draw line
                let line = document.createElementNS("http://www.w3.org/2000/svg", "line");

                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);
                line.setAttribute("stroke", "var(--text)");
                back.appendChild(line);

                // add arrow
                let scale = 7;

                let arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                let leftX = Math.round(x2 + Math.cos(angle + Math.PI / 2) * scale - Math.cos(angle) * scale);
                let leftY = Math.round(y2 + Math.sin(angle + Math.PI / 2) * scale - Math.sin(angle) * scale);
                let rightX = Math.round(x2 + Math.cos(angle - Math.PI / 2) * scale - Math.cos(angle) * scale);
                let rightY = Math.round(y2 + Math.sin(angle - Math.PI / 2) * scale - Math.sin(angle) * scale);
                arrow.setAttribute("points", `${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}`);
                arrow.setAttribute("fill", "var(--text)");
                back.appendChild(arrow);
            }

            let labelText = "";
            for (let i = 0; i < labels[y][x].length; i++) {
                labelText += transitionType[labels[y][x][i]];
                if (i !== labels[y][x].length - 1) {
                    labelText += ",";
                }
            }

            // transition to self
            if (transitionTo === y) {
                // add transition label
                let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", statePositions[y][0] + radius);
                label.setAttribute("y", statePositions[y][1] + radius);
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("dominant-baseline", "middle");
                label.setAttribute("paint-order", "stroke");
                label.setAttribute("stroke-width", "2px");
                label.setAttribute("stroke", "var(--back)");
                label.setAttribute("fill", "var(--text)");
                label.innerHTML = labelText;
                top.appendChild(label);
            } else {
                // add transition label
                let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", Math.round((x1 + x2) / 2));
                label.setAttribute("y", Math.round((y1 + y2) / 2));
                labelPoses.push([Math.round((x1 + x2) / 2), Math.round((y1 + y2) / 2)]);
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("dominant-baseline", "middle");
                label.setAttribute("paint-order", "stroke");
                label.setAttribute("stroke-width", "2px");
                label.setAttribute("stroke", "var(--back)");
                label.setAttribute("fill", "var(--text)");
                label.innerHTML = labelText;
                top.appendChild(label);
            }
        }
    }

    svg.setAttribute("height", diagramHeight);
    svg.setAttribute("width", diagramWidth);
}

function generateTable() {
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);

    let table = document.getElementById("input-table");

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
            if (i <= oldHeight && j < oldWidth) {
                input.value = oldInputs[i - 1][j];
            }


            cell.appendChild(input);
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }

    table.appendChild(tbody);

    generateButtons();
}

function copiedMessage() {
    let copy = document.getElementById("copy-msg");
    copy.innerText = "Copied!";
    setTimeout(() => {
        copy.innerText = "";
    }, 1500);
}

document.getElementById("width").addEventListener("change", generateTable);
document.getElementById("height").addEventListener("change", generateTable);

function generateButtons() {
    let initial = document.getElementById("initial-states");
    let final = document.getElementById("final-states");

    initial.innerHTML = "";
    final.innerHTML = "";

    let states = parseInt(document.getElementById("height").value);
    for(let i = 0; i < states; i++) {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `initial${i}`;
        checkbox.checked = false;
        let label = document.createElement("label");
        label.htmlFor = `initial${i}`;
        label.innerText = `${i}`;
        initial.appendChild(checkbox);
        initial.appendChild(label);

        checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `final${i}`;
        checkbox.checked = false;
        label = document.createElement("label");
        label.htmlFor = `final${i}`;
        label.innerText = `${i}`;
        final.appendChild(checkbox);
        final.appendChild(label);
    }
}

document.getElementById("state-prefix").addEventListener("change", () => {
    statePrefix = document.getElementById("state-prefix").value;

    // update all first elements in table rows
    let table = document.getElementById("input-table").children[0];
    for (let i = 1; i < table.children.length; i++) {
        table.children[i].children[0].innerText = statePrefix + (i - 1);
    }
});

document.getElementById("transition-type").addEventListener("change", () => {
    let type = document.getElementById("transition-type").value;
    let header = document.getElementById("input-table").children[0].children[0].children;
    for (let i = 1; i < header.length; i++) {
        header[i].innerText = type[i - 1];
    }

    transitionType = type;
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

function init() {
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let cell = document.getElementById(`cell${i}${j}`);
            cell.addEventListener("change", generateSVG);
        }
    }

    createPositions(height);

    setInterval(generateSVG, 100);
    generateButtons();
}

window.onload = init;