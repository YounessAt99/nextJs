import connectDB from "@/config/database";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";
import cloudinary from "@/config/cloudinary";

// GET api/properties
export const GET = async (request) => {
    try {
        await connectDB();
        
        const properties = await Property.find({});
        // console.log(properties);

        return new Response(JSON.stringify(properties) , {status: 200})

    } catch (error) {
        console.log(error);
         return new Response('Something Went Wrong', {status: 500})
    }
}; 

export const POST = async (request) => {
    try {
        await connectDB();
        
        const sessionUser = await getSessionUser();

        if ( !sessionUser || !sessionUser.userId ) {
            return new Response('User Id is required', {status: 404});
        }

        const { userId } = sessionUser;

        const formData = await request.formData();
        // console.log('formData', formData.get('name'));

        // Access all values from amenities and images
        const amenities = formData.getAll('amenities');
        const images = formData.getAll('images').filter((image)=> image.name !== '')
        // .map((image) => {
        //     return `https://yourstorageurl.com/path/to/${image.name}`;
        // })
        ;
        // console.log(amenities,images);

        const propertyData = {
            type: formData.get('type'),
            name: formData.get('name'),
            description: formData.get('description'),
            location: {
                street: formData.get('location.street'),
                city: formData.get('location.city'),
                state: formData.get('location.state'),
                zipcode: formData.get('location.zipcode'),
            },
            beds: formData.get('beds'),
            baths: formData.get('baths'),
            square_feet: formData.get('square_feet'),
            amenities,
            rates: {
                weekly: formData.get('rates.weekly'),
                monthly: formData.get('rates.monthly'),
                nightly: formData.get('rates.nightly'),
            },
            seller_info: {
                name: formData.get('seller_info.name'),
                email: formData.get('seller_info.email'),
                phone: formData.get('seller_info.phone'),
            },
            owner: userId
        };
        // console.log(propertyData);

        // Upload image(s) to Cloadinary
        const imagesUploadPromises = [];

        for( const image of images ){
            try {
                const imageBuffer = await image.arrayBuffer();
                const imageArray = Array.from(new Uint8Array(imageBuffer));
                const imageData = Buffer.form(imageArray);
                // 
                // console.log('New Property saved:', 'result');
                // return new Response(JSON.stringify({message: 'result'}),
                //     {status: 200}
                // );
    
                // Convert the image data to base64
                const imageBase64 = imageData.toString('base64');
    
                // Make request to upload to Cloudinary
                const result = await cloudinary.uploader.upload(
                    `data:image/png;base64,${imageBase64}`,{
                        folder: 'propertyPulse'
                    }
                );
            
                imagesUploadPromises.push(result.secure_url);
                
                // wait for all images to upload 
                const uploadedImages = await Promise.all(imagesUploadPromises);
                // add uploaded image to the propertyData object 
                propertyData.images = uploadedImages;
            } catch (error) {
                console.error('Error uploading image to Cloudinary:', error);
            }
        };

        // console.log('New Property saved:', propertyData);
        // return new Response(JSON.stringify({message: 'Success'}),
        //     {status: 200}
        // );
        

        const newProperty = new Property(propertyData);

        // Validate the new property data
        // const validationError = newProperty.validateSync();
        // if (validationError) {
        //     console.error('Validation Error:', validationError);
        //     return new Response(`Validation Error: ${validationError.message}`, { status: 400 });
        // }
        
        await newProperty.save();
        console.log('New Property saved:', newProperty);

        return Response.redirect(
            `${process.env.NEXTAUTH_URL}/properties/${newProperty._id}`
        );

    } catch (error) {
        return new Response('Failed to add property',
            {status: 500}
        );
        // console.log(error);
    }
}