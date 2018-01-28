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

function processEnrollmentTable(enrollmentTable, studentList) {
    if (!studentList) {
        studentList = [];
    }
    for (let child of enrollmentTable.firstElementChild.children) {
        // tr
        let userNameLink = child.getElementsByClassName("user-name")[0].firstElementChild;
        let userNameParts = /^(.*?)(\s<[Bb]>(.*?)<\/[Bb]>)?$/.exec(userNameLink.innerHTML);
        let userImageElem = child.getElementsByClassName("imagecache")[0];
        studentList.push({ firstName: userNameParts[1] || null, lastName: userNameParts[3] || null, profileLink: userNameLink.href, profileImage: userImageElem.src });
        //console.log(child.id);
    }
    return studentList;
}

function startNextIfCan(enrollmentViewWrapper) {
    let viewNav = enrollmentViewWrapper.getElementsByClassName("enrollment-view-nav")[0];
    let nextClassButtons = viewNav.getElementsByClassName("next");
    if (nextClassButtons.length != 1) {
        return false;
    }
    let nextClassButton = nextClassButtons[0];
    if (nextClassButton.classList.contains("disabled")) {
        return false;
    }
    nextClassButton.click();
    return true;
}

function handleDownloadClick() {
    // init
    if (linkButton.classList.contains("active")) {
        // already doing this
        return;
    }

    linkButton.classList.add("active");
    let enrollmentsWrapper = document.getElementById("roster-wrapper").getElementsByClassName("enrollments-wrapper")[0];
    let studentList = processEnrollmentTable(enrollmentsWrapper.firstElementChild.firstElementChild.firstElementChild);

    // it's not terribly clean, but we'll hook the UI
    // id roster-wrapper
    // class right
    // observe class enrollments-wrapper

    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            for (let addedNode of mutation.addedNodes) {
                if (addedNode.classList.contains("enrollment-view-wrapper")) {
                    // TODO error check
                    processEnrollmentTable(addedNode.getElementsByClassName("enrollment-user-list")[0].firstElementChild, studentList);
                    if (!startNextIfCan(addedNode)) {
                        finishListProcess(studentList, observer, linkButton);
                    }
                    break;
                }
            }
        });
    });

    observer.observe(enrollmentsWrapper, { attributes: false, childList: true, characterData: true, subtree: true });

    // starts on current page (side effect of UI hook)
    // bug or feature?
    if (!startNextIfCan(enrollmentsWrapper.firstElementChild)) {
        finishListProcess(studentList, observer, linkButton);
    }
}

function serializeList(studentList) {
    let result = "";
    for (let student of studentList) {
        result += `${student.firstName}\t${student.lastName || "<NULL>"}\t${student.profileLink}\t${student.profileImage}\n`;
    }
    return result;
}

function finishListProcess(studentList, observer, linkButton) {
    let file_path = URL.createObjectURL(new Blob([serializeList(studentList)], {type : 'text/plain'}));
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
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    linkButton.classList.remove("active");
}