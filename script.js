const MAPTILER_KEY = "UomrDFbzzlySTgrvKD2e";
const GUARDIAN_KEY = "f20a47fd-17e6-4b51-8421-3875d3acfe06";


let map;
let marker = null;

let selectedPlace = "";
let selectedCountry = "";
let selectedLatitude = null;
let selectedLongitude = null;

map = new maplibregl.Map({

    container: "map",

    style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,

    center: [77.2090,28.6139],

    zoom: 4,

    attributionControl:false

});

map.addControl(

    new maplibregl.NavigationControl(),

    "bottom-right"

);

flatpickr("#datePicker",{

    dateFormat:"Y-m-d",

    defaultDate:"today",

    minDate:"1900-01-01",

    maxDate:"today"

});

function flyToLocation(lat,lon){

    map.flyTo({

        center:[lon,lat],

        zoom:11,

        speed:1.1,

        essential:true

    });

}

function placeMarker(lat,lon){

    if(marker){

        marker.remove();

    }

    marker=new maplibregl.Marker({

        color:"#22c55e"

    })

    .setLngLat([lon,lat])

    .addTo(map);

}

function updateLocationUI(){

    document.getElementById("placeTitle").innerText=selectedPlace;

    document.getElementById("countryName").innerText=selectedCountry;

    document.getElementById("coordinates").innerHTML=

    `Latitude : ${selectedLatitude.toFixed(6)}

    <br>

    Longitude : ${selectedLongitude.toFixed(6)}`;

}

async function reverseGeocode(lat,lon){

    try{

        const response=await fetch(

`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`

        );

        const data=await response.json();

        selectedLatitude=lat;

        selectedLongitude=lon;

        selectedPlace=

        data.address.city ||

        data.address.town ||

        data.address.village ||

        data.address.hamlet ||

        data.address.county ||

        data.name ||

        "Unknown";

        selectedCountry=

        data.address.country ||

        "";

        updateLocationUI();

    }

    catch(error){

        console.log(error);

    }

}

async function searchPlace(){

    const query=

    document

    .getElementById("searchBox")

    .value

    .trim();

    if(query==="") return;

    try{

        const response=await fetch(

`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1`

        );

        const data=await response.json();

        if(data.length===0){

            alert("Location not found.");

            return;

        }

        const place=data[0];

        selectedLatitude=parseFloat(place.lat);

        selectedLongitude=parseFloat(place.lon);

        selectedPlace=place.display_name.split(",")[0];

        selectedCountry=

        place.display_name.split(",").pop().trim();

        placeMarker(

            selectedLatitude,

            selectedLongitude

        );

        flyToLocation(

            selectedLatitude,

            selectedLongitude

        );

        updateLocationUI();

    }

    catch(error){

        console.log(error);

    }

}

document

.getElementById("searchBtn")

.addEventListener(

"click",

searchPlace

);

document

.getElementById("searchBox")

.addEventListener(

"keydown",

function(e){

if(e.key==="Enter"){

searchPlace();

}

});

map.on("click",function(e){

    selectedLatitude=e.lngLat.lat;

    selectedLongitude=e.lngLat.lng;

    placeMarker(

        selectedLatitude,

        selectedLongitude

    );

    reverseGeocode(

        selectedLatitude,

        selectedLongitude

    );

});

async function loadWikipediaSummary() {

    if (!selectedPlace) return;

    document.getElementById("summary").innerHTML = "Loading...";
    document.getElementById("events").innerHTML = "Loading...";
    document.getElementById("archive").innerHTML = "Loading...";

    try {

        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedPlace)}`
        );

        if (!response.ok) {
            throw new Error("Wikipedia page not found");
        }

        const data = await response.json();

        let html = "";

        if (data.thumbnail) {

            html += `
                <img
                    src="${data.thumbnail.source}"
                    style="width:100%;border-radius:8px;margin-bottom:15px;">
            `;

        }

        html += `
            <p>${data.extract || "No summary available."}</p>
        `;

        if (data.content_urls?.desktop?.page) {

            html += `
                <br>
                <a
                    href="${data.content_urls.desktop.page}"
                    target="_blank">
                    Read Full Article →
                </a>
            `;

        }

        document.getElementById("summary").innerHTML = html;

    }

    catch {

        document.getElementById("summary").innerHTML =
            "No Wikipedia article found.";

    }

    loadOnThisDay();

    buildArchiveLink();

}



async function loadOnThisDay() {

    const selectedDate =
        document.getElementById("datePicker").value;

    const date = new Date(selectedDate);

    const month = date.getMonth() + 1;

    const day = date.getDate();

    try {

        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
        );

        const data = await response.json();

        let html = "<ul>";

        let count = 0;

        data.events.forEach(event => {

            if (count >= 8) return;

            html += `
                <li>
                    <strong>${event.year}</strong>
                    — ${event.text}
                </li>
            `;

            count++;

        });

        html += "</ul>";

        document.getElementById("events").innerHTML = html;

    }

    catch {

        document.getElementById("events").innerHTML =
            "No historical events found.";

    }

}



function buildArchiveLink() {

    const query =
        encodeURIComponent(selectedPlace);

    document.getElementById("archive").innerHTML = `

        <a
        href="https://archive.org/search?query=${query}"
        target="_blank">

        Search "${selectedPlace}" on Internet Archive →

        </a>

    `;

}







async function loadGuardianNews() {

    document.getElementById("guardian").innerHTML = "Loading articles...";

    try {

        const date =
            document.getElementById("datePicker").value;

        const response = await fetch(

`https://content.guardianapis.com/search?q=${encodeURIComponent(selectedPlace)}&from-date=${date}&to-date=${date}&show-fields=headline,trailText&api-key=${GUARDIAN_KEY}`

        );

        const data = await response.json();

        if (
            !data.response ||
            data.response.results.length === 0
        ) {

            document.getElementById("guardian").innerHTML =
                "No Guardian articles found.";

            return;

        }

        let html = "";

        data.response.results.slice(0,5).forEach(article=>{

            html += `

            <div style="margin-bottom:18px">

            <a href="${article.webUrl}"

            target="_blank">

            <strong>

            ${article.webTitle}

            </strong>

            </a>

            <br>

            ${article.webPublicationDate.substring(0,10)}

            </div>

            `;

        });

        document.getElementById("guardian").innerHTML = html;

    }

    catch{

        document.getElementById("guardian").innerHTML =
        "Guardian API unavailable.";

    }

}



async function loadNASA(){

    document.getElementById("nasa").innerHTML="Loading NASA...";

    try{

        const date=document.getElementById("datePicker").value;

        const response=await fetch(

`https://api.nasa.gov/planetary/apod?date=${date}&api_key=${NASA_KEY}`

        );

        const data=await response.json();

        let html="";

        if(data.media_type==="image"){

            html+=`

            <img

            src="${data.url}"

            style="width:100%;border-radius:8px;margin-bottom:15px;">

            `;

        }

        html+=`

        <strong>

        ${data.title}

        </strong>

        <br><br>

        <p>

        ${data.explanation}

        </p>

        `;

        document.getElementById("nasa").innerHTML=html;

    }

    catch{

        document.getElementById("nasa").innerHTML=

        "NASA has no data for this date.";

    }

}



async function loadImage(){

    document.getElementById("images").innerHTML="Loading image...";

    try{

        const response=await fetch(

`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedPlace)}`

        );

        const data=await response.json();

        if(data.thumbnail){

            document.getElementById("images").innerHTML=`

            <img

            src="${data.thumbnail.source}"

            style="width:100%;border-radius:8px;">

            `;

        }

        else{

            document.getElementById("images").innerHTML=

            "No image available.";

        }

    }

    catch{

        document.getElementById("images").innerHTML=

        "Image unavailable.";

    }

}



document

.getElementById("exploreBtn")

.addEventListener(

"click",

async()=>{

    document.getElementById("loading").style.display="block";

    await loadWikipediaSummary();

    await loadGuardianNews();

    await loadNASA();

    await loadImage();

    document.getElementById("loading").style.display="none";

}

);


function formatDate(date){

    return new Date(date)

    .toLocaleDateString(

        "en-US",

        {

            year:"numeric",

            month:"long",

            day:"numeric"

        }

    );

}



function showLoading(){

    document.getElementById("loading").style.display="block";

}



function hideLoading(){

    document.getElementById("loading").style.display="none";

}



function clearResults(){

    document.getElementById("summary").innerHTML="";

    document.getElementById("events").innerHTML="";

    document.getElementById("guardian").innerHTML="";

    document.getElementById("images").innerHTML="";

    document.getElementById("nasa").innerHTML="";

    document.getElementById("archive").innerHTML="";

}



async function loadEverything(){

    if(!selectedPlace){

        alert("Search or click a location first.");

        return;

    }

    showLoading();

    clearResults();

    await loadWikipediaSummary();

    await loadGuardianNews();

    await loadImage();

    buildArchiveLink();

    const selectedDate=document

    .getElementById("datePicker")

    .value;

    if(

        new Date(selectedDate)>=

        new Date("1995-06-16")

    ){

        await loadNASA();

    }

    else{

        document.getElementById("nasa").innerHTML=

        "NASA APOD is only available from June 16, 1995 onwards.";

    }

    hideLoading();

}



document

.getElementById("exploreBtn")

.onclick=loadEverything;



map.on("load",()=>{

    console.log(

        "History Explorer Ready"

    );

});

const suggestions=document.createElement("div");

suggestions.id="suggestions";

document.body.appendChild(suggestions);

Object.assign(suggestions.style,{

position:"fixed",

top:"78px",

right:"35px",

width:"330px",

background:"#111",

border:"1px solid #222",

borderRadius:"10px",

display:"none",

maxHeight:"300px",

overflowY:"auto",

zIndex:"99999"

});



async function autocomplete(){

    const query=document

    .getElementById("searchBox")

    .value

    .trim();

    if(query.length<3){

        suggestions.style.display="none";

        return;

    }

    try{

        const response=await fetch(

`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`

        );

        const places=await response.json();

        suggestions.innerHTML="";

        if(places.length===0){

            suggestions.style.display="none";

            return;

        }

        places.forEach(place=>{

            const item=document.createElement("div");

            item.style.padding="12px";

            item.style.cursor="pointer";

            item.style.borderBottom="1px solid #222";

            item.innerHTML=

            `<strong>${place.display_name.split(",")[0]}</strong>

            <br>

            <small>${place.display_name}</small>`;

            item.onmouseenter=()=>{

                item.style.background="#1b1b1b";

            };

            item.onmouseleave=()=>{

                item.style.background="transparent";

            };

            item.onclick=()=>{

                suggestions.style.display="none";

                document

                .getElementById("searchBox")

                .value=

                place.display_name;

                selectedLatitude=parseFloat(place.lat);

                selectedLongitude=parseFloat(place.lon);

                selectedPlace=

                place.display_name.split(",")[0];

                selectedCountry=

                place.display_name.split(",").pop().trim();

                updateLocationUI();

                placeMarker(

                    selectedLatitude,

                    selectedLongitude

                );

                flyToLocation(

                    selectedLatitude,

                    selectedLongitude

                );

            };

            suggestions.appendChild(item);

        });

        suggestions.style.display="block";

    }

    catch(e){

        console.log(e);

    }

}



document

.getElementById("searchBox")

.addEventListener(

"input",

autocomplete

);



document.addEventListener(

"click",

function(e){

    if(

        !suggestions.contains(e.target)

        &&

        e.target.id!=="searchBox"

    ){

        suggestions.style.display="none";

    }

});



map.on("mousemove",function(e){

    document.body.style.cursor="crosshair";

});



map.on("dragstart",function(){

    document.body.style.cursor="grabbing";

});



map.on("dragend",function(){

    document.body.style.cursor="crosshair";

});



map.on("zoomend",function(){

    console.log(

        "Zoom:",

        map.getZoom().toFixed(2)

    );

});



console.log(

"%cHistory Explorer Loaded",

"color:#22c55e;font-size:18px;font-weight:bold"

);
