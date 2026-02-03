<script>
  import ContactForm from "$lib/components/ContactForm.svelte";
  import HeaderImage from "$lib/assets/Path.webp?enhanced&format=webp&w=1024;512";
</script>

<h1>Contact Me</h1>

<p><enhanced:img src={HeaderImage} alt="A narrow pathway in the hills, stretching toward the horizon." sizes="min(48rem, 100vw)" /></p>

<p>For further inquiries, or to get in touch with me, please fill out the form below.</p>

<ContactForm />
