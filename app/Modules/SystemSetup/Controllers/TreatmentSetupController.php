<?php

namespace App\Modules\SystemSetup\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TreatmentSetupController extends Controller
{
    public function index(): Response
    {
        $categories = TreatmentCategory::with(['treatments' => fn ($q) => $q->orderBy('ordering')])
            ->orderBy('ordering')
            ->get();

        $allTreatments = Treatment::with('category')
            ->orderBy('category_id')
            ->orderBy('ordering')
            ->get();

        return Inertia::render('SystemSetup/Treatments', [
            'categories' => $categories,
            'treatments' => $allTreatments,
        ]);
    }

    // Category CRUD
    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'ordering' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        TreatmentCategory::create([
            'name' => $validated['name'],
            'ordering' => $validated['ordering'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Treatment category created.');
    }

    public function updateCategory(Request $request, int $id): RedirectResponse
    {
        $category = TreatmentCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'ordering' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $category->update([
            'name' => $validated['name'],
            'ordering' => $validated['ordering'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(int $id): RedirectResponse
    {
        $category = TreatmentCategory::findOrFail($id);
        $category->delete();

        return redirect()->back()->with('success', 'Category deleted.');
    }

    // Treatment Catalog CRUD
    public function storeTreatment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:treatment_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'ordering' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        Treatment::create([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'price' => $validated['price'],
            'ordering' => $validated['ordering'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Treatment service added successfully.');
    }

    public function updateTreatment(Request $request, int $id): RedirectResponse
    {
        $treatment = Treatment::findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['required', 'exists:treatment_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'ordering' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $treatment->update([
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'price' => $validated['price'],
            'ordering' => $validated['ordering'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Treatment updated successfully.');
    }

    public function destroyTreatment(int $id): RedirectResponse
    {
        $treatment = Treatment::findOrFail($id);
        $treatment->delete();

        return redirect()->back()->with('success', 'Treatment removed.');
    }
}

