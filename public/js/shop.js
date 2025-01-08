function toggleSection(button) {
    const content = button.nextElementSibling;
    const chevron = button.querySelector('.chevron');

    // Toggle the current section
    const isOpen = content.classList.toggle('show');
    chevron.classList.toggle('rotate', isOpen);

    // Close other sections
    document.querySelectorAll('.filter-content.show').forEach(section => {
        if (section !== content) {
            section.classList.remove('show');
            section.previousElementSibling.querySelector('.chevron').classList.remove('rotate');
        }
    });
}


function updateQueryParam(key, value) {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value);
	return url.href;
}