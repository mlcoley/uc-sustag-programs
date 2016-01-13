MyApp = {};
MyApp.spreadsheetData = [];
MyApp.keywords = [];
MyApp.headerData = [
    { "sTitle": "Program" }, { "sTitle": "Description" }, { "sTitle": "Website" }, { "sTitle": "Contacts" }, { "sTitle": "Email" }, {"sTitle": "Tags"}
];
//filterIndexes is a map between names and the index in headerData (likely spreadsheetData too)
MyApp.filterIndexes = { "tag": 5};
MyApp.Tags = [];

String.prototype.trunc = function (n) {
    return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};

/* instructions for making a spreadsheet accessible
http://billing.chillidoghosting.com/knowledgebase/48/Publishing-Spreadsheets-to-Google-Docs.html
*/

$(function () {
    // var url = "https://spreadsheets.google.com/feeds/list/1GdRFYqi725g_ySoRRX_v7MTlQnusbCFST5smhZEzczc/1/public/values?alt=json-in-script&callback=?";
    var url = "https://spreadsheets.google.com/feeds/list/1Yrq7iNjFIUGv9N1DLATs_WlP-i9VUQYqb23lnUaQMJA/1/public/values?alt=json-in-script&callback=?";
    $.getJSON(url, {}, function (data) {
        $.each(data.feed.entry, function (key, val) {
            var prog = val.gsx$programs.$t;
            var desc = val.gsx$description.$t;
            var website = "<a target='_blank' href='" + val.gsx$website.$t + "'><i class='icon-globe'></i> Website</a>";
            var contacts = val.gsx$contacts.$t;
            var email = "<a href='mailto:" + val["gsx$email"].$t + "'><i class='icon-envelope'></i> Email</a>";
            var tags = val.gsx$tags.$t;

            MyApp.spreadsheetData.push(
                [
                    prog, GenerateDescription(val), website, contacts, email, tags
                ]);

            $.each(tags.trim().replace(/^[\r\n]+|\.|[\r\n]+$/g, "").split(';'), function (key, val) {
                val = val.trim(); //need to trim the semi-colon separated values after split

                if ($.inArray(val, MyApp.Tags) === -1 && val.length !== 0) {
                    MyApp.Tags.push(val);
                }
            });
        });

        MyApp.Tags.sort();

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
    var $tags = $("#tags");

    $.each(MyApp.Tags, function (key, val) {
        $tags.append('<li><label><input type="checkbox" name="' + val + '"> ' + val + '</label></li>');
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

function GenerateDescription(val /* entry value from spreadsheet */){
    var desc_short = "<span style='font-size: 0.8em;'>" + val.gsx$description.$t.trunc(80) + "</span>";
    var tmp = "Title";
    /*replace single-quotes with html code*/
    var desc = val.gsx$description.$t.replace(/'/g, "&#39;");
    var desc_full = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + desc + "' data-original-title='" + tmp + "'>" + desc_short + "</a>";

    // var project2title = "<span style='font-size: 0.8em;'>" + val.gsx$project2title.$t.trunc(20) + "</span>";
    // var project2details = "Status: " + val.gsx$expectedcompletiondate_2.$t + (val.gsx$linktoprojectwebsite_2.$t ? "—" + val.gsx$linktoprojectwebsite_2.$t : '');
    // var project2 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project2details + "' data-original-title='" + val.gsx$project2title.$t + "'>" + project2title + "</a>";
    //
    // var project3title = "<span style='font-size: 0.8em;'>" + val.gsx$project3title.$t.trunc(20) + "</span>";
    // var project3details = "Status: " + val.gsx$expectedcompletiondate_3.$t + (val.gsx$linktoprojectwebsite_3.$t ? "—" + val.gsx$linktoprojectwebsite_3.$t : '');
    // var project3 = "<a href='#' class='project-popover' data-toggle='popover' data-content='" + project3details + "' data-original-title='" + val.gsx$project3title.$t + "'>" + project3title + "</a>";

    // var projects = project1 + (val.gsx$project2title.$t ? project2 : '') + (val.gsx$project3title.$t ? project3 : '');

    return desc_full;
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
            { "bVisible": false, "aTargets": [ -1 ] } //hide the tags column (the last one)
        ],
        "iDisplayLength": 20,
        "bLengthChange": false,
        "aaData": MyApp.spreadsheetData,
        "aoColumns": MyApp.headerData
    });
}
