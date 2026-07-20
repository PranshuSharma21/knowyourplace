const MAPTILER_KEY="UomrDFbzzlySTgrvKD2e";
const GUARDIAN_KEY="f20a47fd-17e6-4b51-8421-3875d3acfe06";

let map;
let marker=null;

let selectedPlace="";
let selectedCountry="";
let selectedLatitude="";
let selectedLongitude="";

map = new maplibregl.Map({
    container:"map",
    style:"https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}",
    center:[77.2090,28.6139],
    zoom:4,
    attributionControl:false
})


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
        centre:[lon,lat],
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
        const resposnse=await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
        );
        const data=await resposnse.json();
        selectedLatitude=lat;
        selectedLongitude=lon;
        selectedPlace=
            data.address.city||
            data.address.town||
            data.address.village||
            data.address.hamlet||
            data.address.county||
            data.name||
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




























































