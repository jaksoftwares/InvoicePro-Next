import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { withAuth } from '../../../lib/authMiddleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      // Get user profile from database
      const { data: profile, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch profile' },
          { status: 500 }
        );
      }

      // If profile doesn't exist, create a basic one
      if (!profile) {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (user.user) {
          const newProfile = {
            id: userId,
            email: user.user.email,
            name: user.user.user_metadata?.name || user.user.user_metadata?.full_name || '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip_code: '',
            country: '',
            website: '',
            company: '',
          };

          const { data: createdProfile, error: createError } = await supabaseAdmin
            .from('users')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create profile:', createError);
            return NextResponse.json(
              { error: 'Failed to create profile' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            profile: {
              ...createdProfile,
              zipCode: createdProfile.zip_code, // Convert snake_case to camelCase
            }
          });
        }
      }

      // Return existing profile with camelCase field names
      return NextResponse.json({
        profile: {
          ...profile,
          zipCode: profile.zip_code, // Convert snake_case to camelCase
        }
      });

    } catch (error) {
      console.error('Profile GET error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      // Get request body
      const body = await req.json();
      const {
        name,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        website,
        company,
      } = body;

      // Update user profile in database
      const { data: profile, error } = await supabaseAdmin
        .from('users')
        .update({
          name,
          phone,
          address,
          city,
          state,
          zip_code: zipCode, // Convert camelCase to snake_case
          country,
          website,
          company,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Profile updated successfully',
        profile: {
          ...profile,
          zipCode: profile.zip_code, // Convert snake_case to camelCase for response
        }
      });

    } catch (error) {
      console.error('Profile PUT error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}