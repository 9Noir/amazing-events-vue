const darkModeBtn = document.querySelector(".toggleDark-btn");
const eventNotFound = [{ id: 0, image: "https://i.ibb.co/HzD6k2W/image.png", name: "No results found", date: new Date(), description: "Sorry, we couldn't find any matching events. Please try again with different search criteria.", category: "Event", place: "", capacity: "", assistance: "", price: "" }];
const { createApp } = Vue;
createApp({
    data() {
        return { currentDate: "", events: [], filteredEvents: [], categories: [], checkedCategories: [], searchText: "", contactContent: { showModal: false }, statsData: {} };
    },
    async created() {
        setDarkMode();
        const path = this.getParams();
        if (path == "stats") return await this.getEventStats();
        const data = await this.fetchData(path);
        this.currentDate = data.currentDate;
        this.events = data.events?.sort((event1, event2) => new Date(event2.date) - new Date(event1.date)) || [data.response];
        this.categories = this.getUniqueCategories(this.events);
        if (document.title.includes("Contact")) this.selectEvent();
    },
    methods: {
        fetchData(params) {
            return fetch(`https://api-amazingevents.onrender.com/api/amazing-events${params || ""}`).then((response) => response.json());
        },
        getParams() {
            const title = document.title.split(" ")[0].toLowerCase();
            if (title.includes("past") || title.includes("upcoming")) return "?time=" + title;
            if (title.includes("details")) return "/" + this.extractIdFromUrl();
            if (title.includes("stats")) return "stats";
            return "";
        },
        getUniqueCategories(events) {
            return [...new Set(events.map((event) => event.category))].sort((a, b) => a.localeCompare(b));
        },
        splitDate(eventDate, dateIndex) {
            return new Date(eventDate).toDateString().split(" ")[dateIndex];
        },
        extractIdFromUrl: () => new URLSearchParams(window.location.search).get("id"),
        selectEvent() {
            this.contactContent.event = this.events.find((e) => e.id == this.extractIdFromUrl())?.name || "not-selected"; //Si no se encuentra, no se accede a name, y entonces se asigna "not-selected"
        },
        toggleContactModal(event) {
            event?.preventDefault();
            this.contactContent.showModal = !this.contactContent.showModal;
        },
        async getEventStats() {
            const upcomingEvents = (await this.fetchData("?time=upcoming")).events;
            const pastEvents = (await this.fetchData("?time=past")).events.sort((a, b) => a.assistance/a.capacity - b.assistance/b.capacity);
            const [maxAssisEvent, minAssisEvent] = [pastEvents[pastEvents.length - 1], pastEvents[0]];
            const maxCapEvent = pastEvents.sort((a, b) => b.capacity - a.capacity)[0];
            let [upcomingCat, pastCat] = [this.getUniqueCategories(upcomingEvents), this.getUniqueCategories(pastEvents)];

            pastCat = this.reduceToCategoryData(pastCat, pastEvents);
            upcomingCat = this.reduceToCategoryData(upcomingCat, upcomingEvents);

            this.statsData = { maxAssisEvent: maxAssisEvent, minAssisEvent: minAssisEvent, maxCapEvent: maxCapEvent, upcomingCat: upcomingCat, pastCat: pastCat };
        },
        reduceToCategoryData(categories, events) {
            return categories
                .map((currentCategory) =>
                    events
                        .filter((e) => e.category === currentCategory)
                        .reduce(
                            (accumulator, event) => {
                                accumulator.revenues += event.price * (event.assistance || event.estimate);
                                accumulator.attendance += event.assistance || event.estimate;
                                accumulator.capacity += event.capacity;
                                return accumulator;
                            },
                            { category: currentCategory, revenues: 0, attendance: 0, capacity: 0 }
                        )
                )
                .sort((a, b) => b.revenues - a.revenues);
        },
    },
    computed: {
        filterEvents() {
            this.filteredEvents = this.events.filter((event) => {
                let categoryMatch = this.checkedCategories.includes(event.category) || this.checkedCategories.length === 0; //Filtrado de eventos para cada event, si su categoria esta incluida en checkedCategories o si no se capturo ningun checked
                let searchMatch = JSON.stringify(event).toLowerCase().includes(this.searchText.toLowerCase());
                return categoryMatch && searchMatch;
            });
            if (this.filteredEvents.length === 0) this.filteredEvents = eventNotFound;
        },
    },
}).mount("#app");

function setDarkMode() {
    document.documentElement.classList.toggle("dark", localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches));
    darkModeBtn.classList.toggle("bi-moon-fill", document.documentElement.classList.contains("dark"));
    darkModeBtn.classList.toggle("bi-moon", !document.documentElement.classList.contains("dark"));
    document.body.style.display = "flex";
}
function toggleDarkMode() {
    localStorage.theme = localStorage.theme === "dark" ? "light" : "dark";
    setDarkMode();
}
