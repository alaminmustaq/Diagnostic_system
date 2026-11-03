<?php

namespace App\Modules\SystemSetup\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RoomSetupController extends Controller
{
    public function index(): Response
    {
        $rooms = Room::orderBy('id', 'desc')->get();

        return Inertia::render('SystemSetup/Rooms', [
            'rooms' => $rooms,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('rooms', 'room_number')->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $isActive = isset($validated['status'])
            ? $validated['status'] === 'active'
            : $request->boolean('is_active', true);

        $status = $isActive ? 'active' : 'inactive';

        Room::create([
            'room_number' => $validated['room_number'],
            'description' => $validated['description'] ?? null,
            'status' => $status,
            'is_active' => $isActive,
        ]);

        return redirect()->route('admin.rooms.index')->with('success', 'Room created successfully!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $room = Room::findOrFail($id);

        $validated = $request->validate([
            'room_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('rooms', 'room_number')
                    ->ignore($room->id)
                    ->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $isActive = isset($validated['status'])
            ? $validated['status'] === 'active'
            : $request->boolean('is_active', $room->is_active);

        $status = $isActive ? 'active' : 'inactive';

        $room->update([
            'room_number' => $validated['room_number'],
            'description' => $validated['description'] ?? null,
            'status' => $status,
            'is_active' => $isActive,
        ]);

        return redirect()->route('admin.rooms.index')->with('success', 'Room updated successfully!');
    }

    public function destroy(int $id): RedirectResponse
    {
        $room = Room::findOrFail($id);
        $room->delete();

        return redirect()->route('admin.rooms.index')->with('success', 'Room removed successfully.');
    }
}

