const officers = {};

function getDataHelper(eventType, officerIDFname, dateFname, data) {
    for (const entry of data) {
        const officerID = entry[officerIDFname].trim();
        const eventDate = new Date(entry[dateFname]);

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
            getDataHelper("terry", "officerid", "reported_date", data);
        }).then(initDropdown);
    });
};

function initDropdown() {
    const dropdown = $("#dropdown");
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
            .text(`Officer ${officerID} (${sum} events)`)
            .data("officerID", officerID);
        dropdown.append(option);
    }

    dropdown.change(() => {
        const officerID = $(dropdown[0].selectedOptions[0]).data("officerID");
        renderChartForOfficer(officerID);
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
            label: "force",
            backgroundColor: "#F6C3A5",
            data: toData(eventTypes["force"])
        });
    }

    if (eventTypes["terry"]) {
        datasets.push({
            label: "terry",
            backgroundColor: "#A2C8F2",
            data: toData(eventTypes["terry"])
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
                    },
                    time: {
                        round: "month"
                    }
                }],
                yAxes: [{
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
