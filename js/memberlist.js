let centerTop = document.getElementById("center-top");

let contentTop = getElementClass(centerTop, "content-top") || createClassElement("content-top", centerTop);
let contentTopWrapper = getElementClass(contentTop, "content-top-wrapper") || createClassElement("content-top-wrapper", contentTop);
let realmTopRight = getElementClass(contentTopWrapper, "realm-top-right") || createClassElement("realm-top-right", contentTopWrapper);
// styling stolen from notification button
realmTopRight.classList.add("realm-top-right-expanded");
let wrapperDiv = createClassElement("download-roster-wrapper", null);
var linkButton = createClassElement("link-btn", null, "a");
linkButton.classList.add("download");
let iconSpan = document.createElement("span");
linkButton.appendChild(iconSpan);
linkButton.innerHTML += "Download Roster";
wrapperDiv.appendChild(linkButton);
realmTopRight.prepend(wrapperDiv);
linkButton.addEventListener("click", handleDownloadClick);

function getElementClass(parent, className) {
    for (let child of parent.children) {
        if (child.classList.contains(className)) {
            return child;
        }
    }
    return null;
}

function createClassElement(className, parent, elementType) {
    let newDiv = document.createElement(elementType || "div");
    newDiv.classList.add(className);
    if (parent) {
        parent.appendChild(newDiv);
    }
    return newDiv;
}

async function handleDownloadClick() {
    // init
    if (linkButton.classList.contains("active")) {
        // already doing this
        return;
    }

    linkButton.classList.add("active");
    let realmType = window.location.pathname.includes("course/") ? "sections" : window.location.pathname.includes("group/") ? "groups" : "";
    let realmId = window.location.pathname.match(/.*?(\d{3,}).*?/)[1];
    
    let studentList = "";

    let enrollments = await fetchApiJson(`/${realmType}/${realmId}/enrollments`);
    do {
        for (let enrollment of enrollments.enrollment) {
            studentList += [enrollment.name_title, enrollment.name_first, enrollment.name_middle, enrollment.name_last, enrollment.name_display, enrollment.school_uid, enrollment.picture_url].join("\t") + "\n";
        }

        if (enrollments.links.next) {
            enrollments = await (await fetchWithApiAuthentication(enrollments.links.next)).json();
        } else {
            enrollments = null;
        }
    } while (enrollments);

    finishListProcess(studentList, linkButton);

    linkButton.classList.remove("active");
}


function finishListProcess(studentList, linkButton) {
    let file_path = URL.createObjectURL(new Blob([studentList], { type: 'text/plain' }));
    let a = document.createElement('A');
    a.href = file_path;
    a.download = "roster.tsv";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // cleanup
    // we can't clean up our generated blob URL because we don't know when the user will download
    // it will die when our page does
    document.body.removeChild(a);
    
    linkButton.classList.remove("active");
}