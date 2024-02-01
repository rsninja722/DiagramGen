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