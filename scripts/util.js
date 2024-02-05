function getTable() {
    let width = parseInt(document.getElementById("width").value) + 1;
    let height = parseInt(document.getElementById("height").value);

    let table = [];
    for (let i = 0; i < height; i++) {
        let row = [];
        for (let j = 0; j < width; j++) {
            let cell = document.getElementById(`cell${i}${j}`);
            if(cell == null) {
                row.push("");
                continue;
            }
            row.push(cell.value);
        }
        table.push(row);
    }
    return table;
}


function getPositions() {
    let table = getTable();
    let states = parseInt(document.getElementById("height").value);

    let initialStates = [];
    for(let i = 0; i < states; i++) {
        let check = document.getElementById(`initial${i}`);
        if(check == null) {
            continue;
        }
        if(check.checked) {
            initialStates.push(i);
        }
    }
    let finalStates = [];
    for(let i = 0; i < states; i++) {
        let check = document.getElementById(`final${i}`);
        if(check == null) {
            continue;
        }
        if(check.checked) {
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

function copiedMessage() {
    let copy = document.getElementById("copy-msg");
    copy.innerText = "Copied!";
    setTimeout(() => {
        copy.innerText = "";
    }, 1500);
}