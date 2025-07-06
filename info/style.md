This is a Template File

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Modern Dev Interface</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
  <!-- Header -->
  <header class="flex items-center justify-between px-4 py-3 bg-gray-800 shadow-md">
    <h1 class="text-lg font-semibold">VisionVault</h1>
    <nav class="space-x-2">
      <button class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">Dashboard</button>
      <button class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">Gallery</button>
      <button class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">Tag Cloud</button>
      <button class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded">Upload</button>
    </nav>
  </header>

  <!-- Main Layout -->
  <div class="flex h-[calc(100vh-56px)]">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
      <h2 class="text-md font-semibold mb-4">Filter</h2>
      <div class="space-y-4 text-sm">
        <button class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Sort alphabetically</button>
        <button class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Sort by upload date</button>
        <button class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">Sort by creation date</button>
      </div>
    </aside>

    <!-- Content -->
    <main class="flex-1 p-6 overflow-y-auto bg-gray-900">
      <div class="bg-gray-800 p-4 rounded shadow">
        <pre class="whitespace-pre-wrap text-sm font-mono text-green-400">
// Hier kommt dein Gallery- oder Code-Content rein
// Du kannst diese Box nutzen, um dynamische Inhalte anzuzeigen
        </pre>
      </div>
    </main>
  </div>
</body>
</html>
