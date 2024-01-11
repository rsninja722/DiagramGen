let statePositions = [];
let labelPoses = [];

function getTable() {
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);

    let table = [];
    for (let i = 0; i < height; i++) {
        let row = [];
        for (let j = 0; j < width; j++) {
            let cell = document.getElementById(`cell${i}${j}`);
            row.push(parseInt(cell.value));
        }
        table.push(row);
    }
    return table;
}

function generateSVG() {
    let table = getTable();
    let svg = document.getElementById("output");
    svg.innerHTML = "";
    let states = parseInt(document.getElementById("height").value);
    
    let radius = 20;
    let spacing = 100;
    let charWidth = 10;

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
        statePositions = [];
        for (let i = 0; i < states; i++) {
            let x = (i % statesSqrt) * spacing;
            if (i % statesSqrt === 0 && i !== 0) {
                yoffset++;
            }
            statePositions.push([x + (spacing / 2), yoffset * spacing + (spacing / 2)]);
        }
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

    let memo = table.map(() => table.map(() => 0));

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
        label.innerHTML = "s" + i;
        front.appendChild(circle);
        top.appendChild(label);
    }

    // add transition lines
    for (let y = 0; y < table.length; y++) {
        for (let x = 0; x < table[y].length; x++) {
            if (table[y][x] === "") {
                continue;
            }
            if (parseInt(table[y][x]) >= states || isNaN(parseInt(table[y][x]))) {
                continue;
            }

            let transitionTo = parseInt(table[y][x]);

            // transition to self
            if (transitionTo === y) {

                // only add label if loop already exists
                if (memo[y][transitionTo] > 0) {
                    // add transition label
                    let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    label.setAttribute("x", statePositions[y][0] + radius + memo[y][transitionTo] * charWidth);
                    label.setAttribute("y", statePositions[y][1] + radius);
                    label.setAttribute("text-anchor", "middle");
                    label.setAttribute("dominant-baseline", "middle");
                    label.setAttribute("paint-order", "stroke");
                    label.setAttribute("stroke-width", "2px");
                    label.setAttribute("stroke", "var(--back)");
                    label.setAttribute("fill", "var(--text)");
                    label.innerHTML = "," + "abcdefghijklmnopqrstuvwxyz"[x];
                    top.appendChild(label);

                    memo[y][transitionTo]++;

                    continue;
                }
                // draw loop to self
                let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", statePositions[y][0] + radius / 2);
                circle.setAttribute("cy", statePositions[y][1] + radius / 2);
                circle.setAttribute("r", radius * 0.8);
                circle.setAttribute("fill", "none");
                circle.setAttribute("stroke", "var(--text)");
                back.appendChild(circle);

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
                label.innerHTML = "abcdefghijklmnopqrstuvwxyz"[x];
                top.appendChild(label);

                memo[y][transitionTo]++;
                continue;
            }

            // use trig to find start point and end point
            let angle = Math.atan2(statePositions[transitionTo][1] - statePositions[y][1], statePositions[transitionTo][0] - statePositions[y][0]);
            let x1 = Math.round(statePositions[y][0] + Math.cos(angle) * radius + Math.cos(angle - Math.PI / 2) * radius / 3);
            let y1 = Math.round(statePositions[y][1] + Math.sin(angle) * radius + Math.sin(angle - Math.PI / 2) * radius / 3);
            let x2 = Math.round(statePositions[transitionTo][0] - Math.cos(angle) * radius + Math.cos(angle - Math.PI / 2) * radius / 3);
            let y2 = Math.round(statePositions[transitionTo][1] - Math.sin(angle) * radius + Math.sin(angle - Math.PI / 2) * radius / 3);

            // only add label if line already exists
            if (memo[y][transitionTo] > 0) {
                // add transition label
                let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", Math.round((x1 + x2) / 2 + memo[y][transitionTo] * charWidth));
                label.setAttribute("y", Math.round((y1 + y2) / 2));
                label.setAttribute("text-anchor", "middle");
                label.setAttribute("dominant-baseline", "middle");
                label.setAttribute("paint-order", "stroke");
                label.setAttribute("stroke-width", "2px");
                label.setAttribute("stroke", "var(--back)");
                label.setAttribute("fill", "var(--text)");
                label.innerHTML = "," + "abcdefghijklmnopqrstuvwxyz"[x];
                top.appendChild(label);

                memo[y][transitionTo]++;

                continue;
            }

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
            label.innerHTML = "abcdefghijklmnopqrstuvwxyz"[x];
            top.appendChild(label);

            memo[y][transitionTo]++;
        }
    }

    svg.setAttribute("height", (statesSqrt) * spacing);
    svg.setAttribute("width", (statesSqrt) * spacing);
}

function generateTable() {
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);

    let table = document.getElementById("input-table");
    table.innerHTML = "";
    for (let i = 0; i < height + 1; i++) {
        let row = document.createElement("tr");
        if (i === 0) {
            row.appendChild(document.createElement("th"));
            for (let j = 0; j < width; j++) {
                let cell = document.createElement("th");
                cell.innerText = "abcdefghijklmnopqrstuvwxyz"[j];
                row.appendChild(cell);
            }
            table.appendChild(row);
            continue;
        }
        let cell = document.createElement("td");
        cell.innerText = "s" + (i - 1);
        row.appendChild(cell);

        for (let j = 0; j < width; j++) {
            let cell = document.createElement("td");
            let input = document.createElement("input");
            input.type = "text";
            input.id = `cell${(i - 1)}${j}`;
            input.addEventListener("change", generateSVG);


            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    generateButtons();
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
        label.innerText = `s${i}`;
        initial.appendChild(checkbox);
        initial.appendChild(label);

        checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `final${i}`;
        checkbox.checked = false;
        label = document.createElement("label");
        label.htmlFor = `final${i}`;
        label.innerText = `s${i}`;
        final.appendChild(checkbox);
        final.appendChild(label);
    }
}

document.getElementById("copy").addEventListener("click", () => {
    let svg = document.getElementById("output");
    navigator.clipboard.writeText(svg.outerHTML.replace(`id="output" `, ""));
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

function init() {
    let width = parseInt(document.getElementById("width").value);
    let height = parseInt(document.getElementById("height").value);

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let cell = document.getElementById(`cell${i}${j}`);
            cell.addEventListener("change", generateSVG);
        }
    }

    setInterval(generateSVG, 100);
    generateButtons();
}

window.onload = init;