import java.util.Map;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

public class HelloLambda implements RequestHandler<Map<String, String>, String> {
    @Override
    public String handleRequest(final Map<String, String> event, final Context context) {
        return null;
    }
}