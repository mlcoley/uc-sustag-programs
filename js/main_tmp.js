MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Name" }, { "sTitle": "Age" }, { "sTitle": "Parents" }, { "sTitle": "Breed" }, { "sTitle": "Activity" }
];
//filterIndexes is a map between names and the index in headerData (likely spreadsheetData too)
MyApp.filterIndexes = { "breed": 3, "activity": 4};
MyApp.Breed = [], MyApp.Activity = [];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

/* instructions for making a spreadsheet accessible
http://billing.chillidoghosting.com/knowledgebase/48/Publishing-Spreadsheets-to-Google-Docs.html
*/

$(function () {
    var url = "https://spreadsheets.google.com/feeds/list/1GdRFYqi725g_ySoRRX_v7MTlQnusbCFST5smhZEzczc/1/public/values?alt=json-in-script&callback=?";
    // var url = "https://spreadsheets.google.com/feeds/list/1gTLWPM9CWy_0R_iUmidClCkwyi7CEbHaYftQ-dfeNF8/1/public/values?alt=json-in-script&callback=?";
    // var url = "https://spreadsheets.google.com/feeds/list/0AhTxmYCYi3fpdGRrelZaT2F0ajBmalJzTlEzQU96dUE/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var name = val.gsx$name.$t;
            var age = val.gsx$age.$t;
            var parents = val.gsx$parents.$t;
            var breed = val.gsx$breed.$t;
            var act = val.gsx$favoriteactivity.$t;

            // var allResearchInfo = val.gsx$gsx:positiontitle.$t + '<br />' + val.gsx$telephone.$t + '<br />' + val.gsx$researchareas.$t;

            MyApp.spreadsheetData.push(
                [
                    name, age, parents, breed, act
                ]);

            if ($.inArray(breed, MyApp.Breed) === -1 && breed.length !== 0) {
                MyApp.Breed.push(breed);
            }
            if ($.inArray(act, MyApp.Activity) === -1 && act.length !== 0) {
                MyApp.Activity.push(act);
            }
        });

        MyApp.Breed.sort();
        MyApp.Activity.sort();
        //MyApp.keywords.sort();

        createDataTable();
        addFilters();
        configurePopups();
    });
})

// function hideUnavailableOrganizations(){
//     var fileredData = MyApp.oTable._('tr', {"filter":"applied"});
//
//     //Get departments available after the filters are set
//     MyApp.Organizations = [];
//     $.each(fileredData, function (key, val) {
//         var org = val[MyApp.filterIndexes["organizations"]];
//
//         if ($.inArray(org, MyApp.Organizations) === -1 && org.length !== 0) {
//                 MyApp.Organizations.push(org);
//         }
//     });
//
//     // $(":checkbox", "#organizations").each(function () {
//     //     //if a checkbox isn't in the list of available departments, hide it
//     //     if ($.inArray(this.name, MyApp.Organizations) === -1) {
//     //         $(this).parent().css("display", "none");
//     //     } else {
//     //         $(this).parent().css("display", "block");
//     //     }
//     // });
// }


function configurePopups(){
    $("#spreadsheet").popover({
        selector: '.researcher-popover, .project-popover',
        trigger: 'hover'
    });
}



function addFilters(){
    var $breed = $("#breed");

    $.each(MyApp.Breed, function (key, val) {
        $breed.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });


    var $activity = $("#activity");

    $.each(MyApp.Activity, function (key, val) {
        $activity.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
    });

    $(".filterrow").on("click", "ul.filterlist", function (e) {
        var filterRegex = "";
        var filterName = this.id;
        var filterIndex = MyApp.filterIndexes[filterName];

        var filters = [];
        $("input", this).each(function (key, val) {
            if (val.checked) {
                if (filterRegex.length !== 0) {
                    filterRegex += "|";
                }

                filterRegex += val.name; //Use the hat and dollar to require an exact match
            }
        });

        MyApp.oTable.fnFilter(filterRegex, filterIndex, true, false);
        // hideUnavailableOrganizations();
        displayCurrentFilters();
    });

    $("#clearfilters").click(function (e) {
        e.preventDefault();

        $(":checkbox", "ul.filterlist").each(function () {
            this.checked = false;
        });

        $("ul.filterlist").click();
    });
}

function GenerateResearcherColumn(val /* entry value from spreadsheet */){
    var name = val.gsx$name.$t;
    var title = val.gsx$positiontitle.$t;

    //var website = "<a target='_blank' href='" + val.gsx$website.$t + "'>" + val.gsx$website.$t + "</a>";
    //var email = "<a href='mailto:" + val["gsx$e-mail"].$t + "'>" + val["gsx$e-mail"].$t + "</a>";
    // var allResearchInfo = "Research areas: " + val.gsx$researchareas.$t;
    var allResearchInfo = val.gsx$researchareas.$t;

    var content = allResearchInfo; //could expand content later
    var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a><br /><span class='discreet'>" + title + "</span>";

    return researcher;
}

function GenerateProjectColumn(val /* entry value from spreadsheet */){
    var project1title = "<span style='font-size: 0.8em;'>" + val.gsx$project1title.$t.trunc(20) + "</span>";
    var project1details = "Status: " + val.gsx$expectedcompletiondate.$t + (val.gsx$linktoprojectwebsite.$t ? "—" + val.gsx$linktoprojectwebsite.$t : '');
    var project1 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project1details + "' data-original-title='" + val.gsx$project1title.$t + "'>" + project1title + "</a>";

    var project2title = "<span style='font-size: 0.8em;'>" + val.gsx$project2title.$t.trunc(20) + "</span>";
    var project2details = "Status: " + val.gsx$expectedcompletiondate_2.$t + (val.gsx$linktoprojectwebsite_2.$t ? "—" + val.gsx$linktoprojectwebsite_2.$t : '');
    var project2 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project2details + "' data-original-title='" + val.gsx$project2title.$t + "'>" + project2title + "</a>";

    var project3title = "<span style='font-size: 0.8em;'>" + val.gsx$project3title.$t.trunc(20) + "</span>";
    var project3details = "Status: " + val.gsx$expectedcompletiondate_3.$t + (val.gsx$linktoprojectwebsite_3.$t ? "—" + val.gsx$linktoprojectwebsite_3.$t : '');
    var project3 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project3details + "' data-original-title='" + val.gsx$project3title.$t + "'>" + project3title + "</a>";

    var projects = project1 + (val.gsx$project2title.$t ? project2 : '') + (val.gsx$project3title.$t ? project3 : '');

    var allResearchInfo = val.gsx$researchareas.$t;

    // var researcher = "<a href='#' class='researcher-popover' data-toggle='popover' data-content='" + allResearchInfo + "' data-original-title='" + name + "'>" + name + "</a><br /><span class='discreet'>" + title + "</span>";

    return projects;
}



function displayCurrentFilters() {
    var $filterAlert = $("#filters");
    //var regionFilter = $("#regions"); // Wrong selector..?

    var filters = "";

    /*
    if (regionFilter){
        filters += "<strong>" + this.name + "</strong>";
    }
    */

    $("input:checked", "#filterAccordian").each(function () {
        if (filters.length !== 0) {
            filters += " + "
        }
        filters += "<strong>" + this.name + "</strong>";
    });

    if (filters.length !== 0) {
        var alert = $("<div class='alert alert-info'><strong>Filters</strong><p>You are filtering on " + filters + "</p></div>")

        $filterAlert.html(alert);
        $filterAlert[0].scrollIntoView(true);
    } else {
        $filterAlert.html(null);
    }
}

function createDataTable() {
    //Create a sorter that uses case-insensitive html content
    jQuery.extend(jQuery.fn.dataTableExt.oSort, {
        "link-content-pre": function (a) {
            return $(a).html().trim().toLowerCase();
        },

        "link-content-asc": function (a, b) {
            return ((a < b) ? -1 : ((a > b) ? 1 : 0));
        },

        "link-content-desc": function (a, b) {
            return ((a < b) ? 1 : ((a > b) ? -1 : 0));
        }
    });

    MyApp.oTable = $("#spreadsheet").dataTable({
        "aoColumnDefs": [
            //{ "sType": "link-content", "aTargets": [ 0 ] },
            //{ "bVisible": false, "aTargets": [ -2, -3, -1 ] } //hide the keywords column for now (the last column, hence -1)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}
