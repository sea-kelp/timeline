const officers = {};

function truncateDate(d) {
    d.setDate(1);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    
    return d;
}

function getDataHelper(eventType, officerIDFname, dateFname, data) {
    for (const entry of data) {
        const officerID = entry[officerIDFname].trim();
        const eventDate = truncateDate(new Date(entry[dateFname]));

        if (!officers[officerID]) {
            officers[officerID] = {};
        }
        if (!officers[officerID][eventType]) {
            officers[officerID][eventType] = {};
        }
        if (!(officers[officerID][eventType][eventDate])) {
            officers[officerID][eventType][eventDate] = 1;
        } else {
            officers[officerID][eventType][eventDate]++;
        }
    }
}

function getData() {
    $.getJSON('data/force.json', data => {
        getDataHelper("force", "ID Number", "Date Occurred", data)
    }).then(() => {
        $.getJSON('data/terry.json', data => {
            getDataHelper("terry", "Officer ID", "Reported Date", data);
        }).then(initDropdown);
    });
};

function initDropdown() {
    const dropdown = $("#dropdown");
    const search = $("#search");
    const summingReducer = (a, b) => a + b;

    // Sort descending by number of events
    const sortedOfficers = Object.entries(officers)
        .map(([officerID, eventTypes]) => [
                officerID,
                Object.values(eventTypes)
                    .map(dataset => Object.values(dataset)
                        .reduce(summingReducer))
                    .reduce(summingReducer)
        ]).sort((a, b) => b[1] - a[1]);

    for (const [officerID, sum] of sortedOfficers) {
        const option = $("<option>")
            .text(`Badge ${officerID} (${sum} events)`)
            .data("officerID", officerID);
        dropdown.append(option);
    }

    dropdown.change(() => {
        const officerID = $(dropdown[0].selectedOptions[0]).data("officerID");
        renderChartForOfficer(officerID);
    });

    search.keypress(e => {
        if (e.which == 13) {
            const officerID = parseInt(search.val());
            if (officers[officerID]) {
                renderChartForOfficer(officerID);
            } else {
                alert("No data found")
            }
        }
    });

    renderChartForOfficer(sortedOfficers[0][0]);
}

function toData(data) {
    return Object.entries(data).map(([key, value]) => ({x: key, y: value}));
}

function renderChartForOfficer(officerID) {
    const eventTypes = officers[officerID];
    const datasets = [];

    if (eventTypes["force"]) {
        datasets.push({
            label: "OPA Allegations",
            backgroundColor: "rgb(255, 99, 132)",
            data: toData(eventTypes["force"]),
            yAxisID: "force"
        });
    }

    if (eventTypes["terry"]) {
        datasets.push({
            label: "Terry Stops",
            backgroundColor: "rgb(54, 162, 235)",
            data: toData(eventTypes["terry"]),
            yAxisID: "terry"
        });
    }

    const chartConfig = {
        type: "scatter",
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                xAxes: [{
                    type: "time",
                    ticks: {
                        max: new Date()
                    }
                }],
                yAxes: [{
                    id: "force",
                    position: "right",
                    scaleLabel: {
                        display: true,
                        labelString: "Number of OPA Allegations"
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }, {
                    id: "terry",
                    position: "left",
                    scaleLabel: {
                        display: true,
                        labelString: "Number of Terry Stops"
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    };

    const canvas = $("<canvas>");
    $("#content").empty().append(canvas);
    const ctx = canvas[0].getContext('2d');
    new Chart(ctx, chartConfig);
}
